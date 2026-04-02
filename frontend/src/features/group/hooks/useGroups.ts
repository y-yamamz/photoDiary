import { useState, useCallback } from 'react';
import type { Group, GroupFormValues } from '../types';
import { MOCK_GROUPS } from '../../album/utils/mockData';

let nextId = MOCK_GROUPS.length + 1;

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([...MOCK_GROUPS]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GroupFormValues>({ groupName: '', comment: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!form.groupName.trim()) {
      setError('グループ名を入力してください');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 400)); // モックディレイ
      if (editingId !== null) {
        setGroups((prev) =>
          prev.map((g) =>
            g.groupId === editingId
              ? { ...g, groupName: form.groupName.trim(), comment: form.comment }
              : g,
          ),
        );
        setEditingId(null);
      } else {
        const newGroup: Group = {
          groupId: nextId++,
          userId: 1,
          groupName: form.groupName.trim(),
          comment: form.comment,
          sortOrder: groups.length + 1,
          createdAt: new Date().toISOString(),
        };
        setGroups((prev) => [...prev, newGroup]);
      }
      setForm({ groupName: '', comment: '' });
    } finally {
      setSaving(false);
    }
  }, [form, editingId, groups.length]);

  const remove = useCallback(async (groupId: number) => {
    await new Promise((r) => setTimeout(r, 300));
    setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
    setDeleteConfirmId(null);
  }, []);

  return {
    groups,
    editingId,
    form,
    deleteConfirmId,
    saving,
    error,
    updateForm,
    startEdit,
    cancelEdit,
    save,
    remove,
    setDeleteConfirmId,
  };
};
