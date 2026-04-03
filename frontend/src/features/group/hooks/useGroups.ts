import { useState, useCallback, useEffect } from 'react';
import type { Group } from '../../../shared/types';
import type { GroupFormValues } from '../types';
import { groupApi } from '../api/groupApi';
import { extractApiError } from '../../../shared/api/apiClient';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GroupFormValues>({ groupName: '', comment: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // グループ一覧をAPIから取得
  useEffect(() => {
    setLoading(true);
    groupApi.getAll()
      .then((data) => setGroups(data ?? []))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const updateForm = useCallback((patch: Partial<GroupFormValues>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const startEdit = useCallback((group: Group) => {
    setEditingId(group.groupId);
    setForm({ groupName: group.groupName, comment: group.comment ?? '' });
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setForm({ groupName: '', comment: '' });
    setError(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId !== null) {
        // 更新
        const updated = await groupApi.update(editingId, {
          groupName: form.groupName.trim(),
          comment: form.comment,
        });
        setGroups((prev) => prev.map((g) => (g.groupId === editingId ? updated : g)));
        setEditingId(null);
      } else {
        // 新規登録
        const created = await groupApi.create({
          groupName: form.groupName.trim(),
          comment: form.comment,
        });
        setGroups((prev) => [...prev, created]);
      }
      setForm({ groupName: '', comment: '' });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }, [form, editingId]);

  const remove = useCallback(async (groupId: number) => {
    try {
      await groupApi.delete(groupId);
      setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  return {
    groups,
    editingId,
    form,
    deleteConfirmId,
    saving,
    loading,
    error,
    updateForm,
    startEdit,
    cancelEdit,
    save,
    remove,
    setDeleteConfirmId,
  };
};
