import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, readExifDate, fileLastModified, convertToOutputFormat, matchesOutputFormat, formatFileSize } from '../utils/fileUtils';
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
  outputFormat: 'jpeg',  // 保存フォーマット（デフォルト: JPEG）
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

    // 全ファイルの撮影日時を並列取得（EXIF → file.lastModified の優先順で使用）
    const rawDates = await Promise.all(valid.map((f) => readExifDate(f)));
    const exifDates = rawDates.map((d, i) => d ?? fileLastModified(valid[i]));
    setState((s) => ({ ...s, exifDates }));

    // 単体の場合は takenAt に反映（EXIF または lastModified の日時をセット）
    if (valid.length === 1) {
      setForm((f) => ({ ...f, takenAt: exifDates[0] }));
    }
  }, []);


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

    // ── ステップ1: フォーマット変換 ─────────────────────────────
    // 保存フォーマットと一致しないファイルを変換する
    const needsConversion = form.files.some((f) => !matchesOutputFormat(f, form.outputFormat));
    let uploadFiles = form.files;

    if (needsConversion) {
      const total = form.files.length;
      setState((s) => ({
        ...s,
        converting: true,
        convertDone: 0,
        convertTotal: total,
        convertProgress: 0,
        uploading: false,
        success: false,
        error: null,
      }));
      try {
        const converted: File[] = [];
        for (let i = 0; i < form.files.length; i++) {
          converted.push(await convertToOutputFormat(form.files[i], form.outputFormat));
          const done = i + 1;
          setState((s) => ({
            ...s,
            convertDone: done,
            convertProgress: Math.round((done / total) * 100),
          }));
        }
        uploadFiles = converted;
      } catch (err) {
        setState((s) => ({ ...s, converting: false, error: extractApiError(err) }));
        return;
      }
      setState((s) => ({ ...s, converting: false }));
    }

    // ── ステップ2: アップロード ────────────────────────────────
    setState((s) => ({ ...s, uploading: true, progress: 0, success: false, error: null }));

    try {
      if (uploadFiles.length === 1) {
        // 単体アップロード
        const fd = new FormData();
        fd.append('file', uploadFiles[0]);
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.upload(fd, form.outputFormat, (pct) => setState((s) => ({ ...s, progress: pct })));
      } else if (form.overrideTakenAt) {
        // 複数ファイル・日付一括指定: 全ファイルに同じ日付でバルクアップロード
        const fd = new FormData();
        uploadFiles.forEach((f) => fd.append('files', f));
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.bulkUpload(fd, form.outputFormat, (pct) => setState((s) => ({ ...s, progress: pct })));
      } else {
        // 複数ファイル・個別EXIF日付: 1枚ずつ個別アップロード
        const total = uploadFiles.length;
        for (let i = 0; i < total; i++) {
          const fd = new FormData();
          fd.append('file', uploadFiles[i]);
          if (form.groupId !== '') fd.append('groupId', String(form.groupId));
          const takenAt = state.exifDates[i] || localDatetimeString();
          fd.append('takenAt', takenAt);
          if (form.location)    fd.append('location', form.location);
          if (form.description) fd.append('description', form.description);
          await photoApi.upload(fd, form.outputFormat, (pct) => {
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

  return { form, state, groups, storage, setFiles, removeFile, updateField, submit, reset };
};
