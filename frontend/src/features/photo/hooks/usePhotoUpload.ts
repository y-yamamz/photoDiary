import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from '../utils/fileUtils';
import { MOCK_GROUPS } from '../../album/utils/mockData';
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
  const [groups] = useState<Group[]>(MOCK_GROUPS);
  const [form, setForm] = useState<UploadFormValues>(defaultForm());
  const [state, setState] = useState<UploadState>(defaultState());

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
      const previews = s.previews.filter((_, i) => i !== index);
      return { ...s, previews };
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
      // モック：ファイル数に関わらず進捗シミュレート
      for (let i = 10; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 80));
        setState((s) => ({ ...s, progress: i }));
      }
      setState((s) => ({ ...s, uploading: false, success: true, previews: [] }));
      setForm(defaultForm());
    } catch {
      setState((s) => ({ ...s, uploading: false, error: 'アップロードに失敗しました' }));
    }
  }, [form.files]);

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
