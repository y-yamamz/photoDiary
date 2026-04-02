import { useState, useCallback, useMemo } from 'react';
import type { Photo, Group, PhotoFilter } from '../types';
import { buildDateTree } from '../../../shared/utils';
import { MOCK_PHOTOS, MOCK_GROUPS } from '../utils/mockData';

export const useAlbum = () => {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [groups] = useState<Group[]>(MOCK_GROUPS);
  const [filter, setFilter] = useState<PhotoFilter>({});
  const [selectedDate, setSelectedDate] = useState<{
    year?: number; month?: number; day?: number;
  }>({});
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2026]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['2026-4']));
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // ── マルチ選択 ────────────────────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((photoId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(photoId) ? next.delete(photoId) : next.add(photoId);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── CRUD ─────────────────────────────────────────────
  const deletePhotos = useCallback((ids: Set<number>) => {
    setPhotos((prev) => prev.filter((p) => !ids.has(p.photoId)));
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setSelectedPhoto(null);
  }, []);

  const updatePhoto = useCallback((updated: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.photoId === updated.photoId ? updated : p)));
    setSelectedPhoto(updated);
  }, []);

  const bulkUpdatePhotos = useCallback((ids: Set<number>, patch: { location?: string; description?: string }) => {
    setPhotos((prev) =>
      prev.map((p) => (ids.has(p.photoId) ? { ...p, ...patch } : p))
    );
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, []);

  // ── フィルター済み ─────────────────────────────────────
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const d = p.takenAt ? new Date(p.takenAt) : new Date(p.createdAt);
      if (selectedDate.year && d.getFullYear() !== selectedDate.year) return false;
      if (selectedDate.month && d.getMonth() + 1 !== selectedDate.month) return false;
      if (selectedDate.day && d.getDate() !== selectedDate.day) return false;
      if (filter.groupId && p.groupId !== filter.groupId) return false;
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        return (
          p.description?.toLowerCase().includes(kw) ||
          p.location?.toLowerCase().includes(kw) ||
          p.tags?.some((t) => t.tagName.toLowerCase().includes(kw))
        );
      }
      return true;
    });
  }, [photos, filter, selectedDate]);

  const dateTree = useMemo(() => buildDateTree(photos), [photos]);

  const toggleYear = useCallback((year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  }, []);

  const toggleMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const selectDate = useCallback((year?: number, month?: number, day?: number) => {
    setSelectedDate({ year, month, day });
  }, []);

  const updateFilter = useCallback((patch: Partial<PhotoFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
    setSelectedDate({});
  }, []);

  const groupById = useMemo(() => {
    return groups.reduce<Record<number, Group>>((acc, g) => {
      acc[g.groupId] = g;
      return acc;
    }, {});
  }, [groups]);

  return {
    photos,
    filteredPhotos,
    groups,
    groupById,
    filter,
    dateTree,
    selectedDate,
    expandedYears,
    expandedMonths,
    selectedPhoto,
    setSelectedPhoto,
    toggleYear,
    toggleMonth,
    selectDate,
    updateFilter,
    clearFilter,
    // 選択
    isSelectMode,
    selectedIds,
    enterSelectMode,
    exitSelectMode,
    toggleSelect,
    selectAll,
    clearSelection,
    // CRUD
    deletePhotos,
    updatePhoto,
    bulkUpdatePhotos,
  };
};
