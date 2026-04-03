import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl, readExifDate, convertHeicToJpeg } from '../utils/fileUtils';
import { albumApi } from '../../album/api/albumApi';
import { photoApi } from '../api/photoApi';
import { extractApiError } from '../../../shared/api/apiClient';
import { logger } from '../../../shared/utils/logger';
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
  location: '',
  description: '',
});

const defaultState = (): UploadState => ({
  previews: [],
  uploading: false,
  converting: false,
  progress: 0,
  success: false,
  error: null,
});

export const usePhotoUpload = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState<UploadFormValues>(defaultForm());
  const [state, setState] = useState<UploadState>(defaultState());

  // グループ一覧をAPIから取得
  useEffect(() => {
    albumApi.getGroups()
      .then((data) => setGroups(data ?? []))
      .catch(() => setGroups([]));
  }, []);

  // 複数ファイルをセット（HEIC は JPEG に変換してからプレビュー生成）
  const setFiles = useCallback(async (files: File[]) => {
    setState((s) => {
      s.previews.forEach(revokePreviewUrl);
      return { ...s, previews: [], error: null, converting: false };
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

    // HEIC ファイルが含まれている場合は変換中フラグを立てる
    const hasHeic = valid.some((f) => /\.heic$/i.test(f.name));
    if (hasHeic) {
      setState((s) => ({ ...s, converting: true }));
    }

    try {
      const converted = await Promise.all(valid.map(convertHeicToJpeg));
      const previews = converted.map(createPreviewUrl);
      setForm((f) => ({ ...f, files: converted }));
      setState((s) => ({
        ...s,
        previews,
        converting: false,
        error: errors.length > 0 ? errors.join('\n') : null,
      }));

      // 最初のファイルの EXIF 撮影日時を自動セット
      readExifDate(converted[0]).then((exifDate) => {
        if (exifDate) setForm((f) => ({ ...f, takenAt: exifDate }));
      });
    } catch {
      setState((s) => ({
        ...s,
        converting: false,
        error: 'HEIC の変換に失敗しました',
      }));
    }
  }, []);

  // 個別ファイルを削除
  const removeFile = useCallback((index: number) => {
    setState((s) => {
      revokePreviewUrl(s.previews[index]);
      return { ...s, previews: s.previews.filter((_, i) => i !== index) };
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
      const onProgress = (pct: number) => setState((s) => ({ ...s, progress: pct }));

      if (form.files.length === 1) {
        // 単体アップロード
        const fd = new FormData();
        fd.append('file', form.files[0]);
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.upload(fd, onProgress);
      } else {
        // 一括アップロード
        const fd = new FormData();
        form.files.forEach((f) => fd.append('files', f));
        if (form.groupId !== '') fd.append('groupId', String(form.groupId));
        if (form.takenAt)        fd.append('takenAt', form.takenAt);
        if (form.location)       fd.append('location', form.location);
        if (form.description)    fd.append('description', form.description);
        await photoApi.bulkUpload(fd, onProgress);
      }

      setState((s) => ({ ...s, uploading: false, success: true, previews: [] }));
      setForm(defaultForm());
    } catch (err) {
      logger.error('写真のアップロードに失敗しました', 'usePhotoUpload', err);
      setState((s) => ({
        ...s,
        uploading: false,
        error: extractApiError(err),
      }));
    }
  }, [form]);

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

  return { form, state, groups, setFiles, removeFile, updateField, submit, reset };
};
