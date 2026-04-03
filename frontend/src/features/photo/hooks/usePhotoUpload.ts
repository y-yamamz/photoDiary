import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from '../utils/fileUtils';
import { albumApi } from '../../album/api/albumApi';
import { photoApi } from '../api/photoApi';
import { extractApiError } from '../../../shared/api/apiClient';
import { logger } from '../../../shared/utils/logger';
import type { Group } from '../../../shared/types';

const defaultForm = (): UploadFormValues => ({
  files: [],
  groupId: '',
  takenAt: new Date().toISOString().slice(0, 16),
  location: '',
  description: '',
});

const defaultState = (): UploadState => ({
  previews: [],
  uploading: false,
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

  // 複数ファイルをセット（既存プレビューを解放してから再生成）
  const setFiles = useCallback((files: File[]) => {
    setState((s) => {
      s.previews.forEach(revokePreviewUrl);
      return { ...s, previews: [], error: null };
    });

    const errors: string[] = [];
    const valid: File[] = [];
    files.forEach((f) => {
      const err = validateImageFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else valid.push(f);
    });

    const previews = valid.map(createPreviewUrl);
    setForm((f) => ({ ...f, files: valid }));
    setState((s) => ({
      ...s,
      previews,
      error: errors.length > 0 ? errors.join('\n') : null,
    }));
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
