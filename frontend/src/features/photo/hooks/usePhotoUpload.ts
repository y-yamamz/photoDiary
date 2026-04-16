import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, readExifDate, convertHeic, formatFileSize, MAX_CONVERT_FILES, MAX_CONVERT_TOTAL_SIZE } from '../utils/fileUtils';
import { albumApi } from '../../album/api/albumApi';
import { photoApi } from '../api/photoApi';
import { extractApiError } from '../../../shared/api/apiClient';
import { logger } from '../../../shared/utils/logger';
import { useStorage } from '../../../shared/hooks/useStorage';
import type { Group } from '../../../shared/types';

/** datetime-local 入力用のローカル日時文字列を生成 */
const localDatetimeString = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const defaultForm = (): UploadFormValues => ({
  files: [],
  groupId: '',
  takenAt: localDatetimeString(),
  overrideTakenAt: false,
  location: '',
  description: '',
  convertFormat: 'none',
});

const defaultState = (): UploadState => ({
  previews: [],
  exifDates: [],
  uploading: false,
  converting: false,
  convertDone: 0,
  convertTotal: 0,
  convertProgress: 0,
  progress: 0,
  success: false,
  error: null,
});

export const usePhotoUpload = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState<UploadFormValues>(defaultForm());
  const [state, setState] = useState<UploadState>(defaultState());
  const { storage, refresh: refreshStorage } = useStorage();

  // グループ一覧をAPIから取得
  useEffect(() => {
    albumApi.getGroups()
      .then((data) => setGroups(data ?? []))
      .catch(() => setGroups([]));
  }, []);

  // 複数ファイルをセット（バリデーションのみ、変換は convertFiles で行う）
  const setFiles = useCallback(async (files: File[]) => {
    setState((s) => {
      s.previews.forEach(revokePreviewUrl);
      return { ...s, previews: [], exifDates: [], error: null, converting: false };
    });

    const errors: string[] = [];
    const valid: File[] = [];
    files.forEach((f) => {
      const err = validateImageFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else valid.push(f);
    });

    if (valid.length === 0) {
      setState((s) => ({ ...s, error: errors.length > 0 ? errors.join('\n') : null }));
      return;
    }

    const previews = valid.map(createPreviewUrl);
    setForm((f) => ({ ...f, files: valid, overrideTakenAt: false }));
    setState((s) => ({
      ...s,
      previews,
      error: errors.length > 0 ? errors.join('\n') : null,
    }));

    // 全ファイルの EXIF 撮影日時を並列取得
    const rawDates = await Promise.all(valid.map((f) => readExifDate(f)));
    const exifDates = rawDates.map((d) => d ?? '');
    setState((s) => ({ ...s, exifDates }));

    // 単体の場合は takenAt にも反映
    if (valid.length === 1 && exifDates[0]) {
      setForm((f) => ({ ...f, takenAt: exifDates[0] }));
    }
  }, []);

  // 変換ボタン押下時: HEIC ファイルを指定形式に変換する
  const convertFiles = useCallback(async () => {
    const files = form.files;
    if (files.length === 0 || form.convertFormat === 'none') return;

    const heicFiles = files.filter((f) => /\.heic$/i.test(f.name));
    if (heicFiles.length === 0) return;

    // 一括変換の制限チェック
    if (heicFiles.length > MAX_CONVERT_FILES) {
      setState((s) => ({
        ...s,
        error: `一括変換できるのは ${MAX_CONVERT_FILES} 枚までです（HEIC ファイル: ${heicFiles.length} 枚）`,
      }));
      return;
    }
    const totalSize = heicFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_CONVERT_TOTAL_SIZE) {
      setState((s) => ({
        ...s,
        error: `変換対象の合計サイズは ${formatFileSize(MAX_CONVERT_TOTAL_SIZE)} 以下にしてください（現在: ${formatFileSize(totalSize)}）`,
      }));
      return;
    }

    const heicCount = heicFiles.length;
    setState((s) => {
      s.previews.forEach(revokePreviewUrl);
      return { ...s, previews: [], converting: true, convertDone: 0, convertTotal: heicCount, convertProgress: 0, error: null };
    });

    try {
      let done = 0;
      const converted = await Promise.all(files.map(async (f) => {
        const result = await convertHeic(f, form.convertFormat);
        if (/\.heic$/i.test(f.name)) {
          done++;
          setState((s) => ({ ...s, convertDone: done, convertProgress: Math.round((done / heicCount) * 100) }));
        }
        return result;
      }));
      const previews = converted.map(createPreviewUrl);
      setForm((f) => ({ ...f, files: converted }));
      setState((s) => ({ ...s, previews, converting: false }));
    } catch {
      setState((s) => ({ ...s, converting: false, error: 'HEIC の変換に失敗しました' }));
    }
  }, [form.files, form.convertFormat]);

  // 個別ファイルを削除
  const removeFile = useCallback((index: number) => {
    setState((s) => {
      revokePreviewUrl(s.previews[index]);
      return {
        ...s,
        previews: s.previews.filter((_, i) => i !== index),
        exifDates: s.exifDates.filter((_, i) => i !== index),
      };
    });
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== index) }));
  }, []);

  const updateField = useCallback(<K extends keyof UploadFormValues>(key: K, value: UploadFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (form.files.length === 0) return;
    setState((s) => ({ ...s, uploading: true, progress: 0, success: false, error: null }));

    try {
      if (form.files.length === 1) {
        // 単体アップロード
        const fd = new FormData();
        fd.append('file', form.files[0]);
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.upload(fd, (pct) => setState((s) => ({ ...s, progress: pct })));
      } else if (form.overrideTakenAt) {
        // 複数ファイル・日付一括指定: 全ファイルに同じ日付でバルクアップロード
        const fd = new FormData();
        form.files.forEach((f) => fd.append('files', f));
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.bulkUpload(fd, (pct) => setState((s) => ({ ...s, progress: pct })));
      } else {
        // 複数ファイル・個別EXIF日付: 1枚ずつ個別アップロード
        const total = form.files.length;
        for (let i = 0; i < total; i++) {
          const fd = new FormData();
          fd.append('file', form.files[i]);
          if (form.groupId !== '') fd.append('groupId', String(form.groupId));
          const takenAt = state.exifDates[i] || localDatetimeString();
          fd.append('takenAt', takenAt);
          if (form.location)    fd.append('location', form.location);
          if (form.description) fd.append('description', form.description);
          await photoApi.upload(fd, (pct) => {
            // 全体進捗 = (完了枚数 + 現在枚数の進捗率) / 総枚数
            setState((s) => ({ ...s, progress: Math.round(((i + pct / 100) / total) * 100) }));
          });
        }
      }

      setState((s) => ({ ...s, uploading: false, success: true, previews: [] }));
      setForm(defaultForm());
      refreshStorage();
    } catch (err) {
      logger.error('写真のアップロードに失敗しました', 'usePhotoUpload', err);
      setState((s) => ({
        ...s,
        uploading: false,
        error: extractApiError(err),
      }));
    }
  }, [form, state.exifDates]);

  const reset = useCallback(() => {
    setState((s) => {
      s.previews.forEach(revokePreviewUrl);
      return defaultState();
    });
    setForm(defaultForm());
  }, []);

  useEffect(() => {
    return () => {
      setState((s) => { s.previews.forEach(revokePreviewUrl); return s; });
    };
  }, []); // eslint-disable-line

  return { form, state, groups, storage, setFiles, convertFiles, removeFile, updateField, submit, reset };
};
