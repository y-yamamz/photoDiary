import { useState, useCallback, useEffect } from 'react';
import type { UploadFormValues, UploadState } from '../types';
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from '../utils/fileUtils';
import { MOCK_GROUPS } from '../../album/utils/mockData';
import type { Group } from '../../../shared/types';

export const usePhotoUpload = () => {
  const [groups] = useState<Group[]>(MOCK_GROUPS);
  const [form, setForm] = useState<UploadFormValues>({
    file: null,
    groupId: '',
    takenAt: new Date().toISOString().slice(0, 16),
    location: '',
    description: '',
  });
  const [state, setState] = useState<UploadState>({
    preview: null,
    uploading: false,
    progress: 0,
    success: false,
    error: null,
  });

  const setFile = useCallback((file: File | null) => {
    if (state.preview) revokePreviewUrl(state.preview);
    if (!file) {
      setForm((f) => ({ ...f, file: null }));
      setState((s) => ({ ...s, preview: null, error: null }));
      return;
    }
    const err = validateImageFile(file);
    if (err) {
      setState((s) => ({ ...s, error: err, preview: null }));
      return;
    }
    const preview = createPreviewUrl(file);
    setForm((f) => ({ ...f, file }));
    setState((s) => ({ ...s, preview, error: null }));
  }, [state.preview]);

  const updateField = useCallback(<K extends keyof UploadFormValues>(key: K, value: UploadFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (!form.file) return;
    setState((s) => ({ ...s, uploading: true, progress: 0, success: false, error: null }));
    try {
      // モック：進捗シミュレート
      for (let i = 10; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 80));
        setState((s) => ({ ...s, progress: i }));
      }
      setState((s) => ({ ...s, uploading: false, success: true }));
      setForm({ file: null, groupId: '', takenAt: new Date().toISOString().slice(0, 16), location: '', description: '' });
      if (state.preview) revokePreviewUrl(state.preview);
      setState((s) => ({ ...s, preview: null }));
    } catch {
      setState((s) => ({ ...s, uploading: false, error: 'アップロードに失敗しました' }));
    }
  }, [form, state.preview]);

  const reset = useCallback(() => {
    if (state.preview) revokePreviewUrl(state.preview);
    setForm({ file: null, groupId: '', takenAt: new Date().toISOString().slice(0, 16), location: '', description: '' });
    setState({ preview: null, uploading: false, progress: 0, success: false, error: null });
  }, [state.preview]);

  useEffect(() => {
    return () => { if (state.preview) revokePreviewUrl(state.preview); };
  }, []); // eslint-disable-line

  return { form, state, groups, setFile, updateField, submit, reset };
};
