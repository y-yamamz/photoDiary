import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Photo, Group, PhotoFilter } from '../types';
import { buildDateTree } from '../../../shared/utils';
import { albumApi } from '../api/albumApi';
import { extractApiError } from '../../../shared/api/apiClient';

export const useAlbum = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PhotoFilter>({});
  const [selectedDate, setSelectedDate] = useState<{
    year?: number; month?: number; day?: number;
  }>({});
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // ── マルチ選択 ────────────────────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── 初期ロード ────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [photosData, groupsData] = await Promise.all([
        albumApi.getPhotos(),
        albumApi.getGroups(),
      ]);
      setPhotos(photosData ?? []);
      setGroups(groupsData ?? []);

      // 最新年月を初期展開
      if (photosData && photosData.length > 0) {
        const dates = photosData
          .map((p) => new Date(p.takenAt ?? p.createdAt))
          .sort((a, b) => b.getTime() - a.getTime());
        const latestYear = dates[0].getFullYear();
        const latestMonth = dates[0].getMonth() + 1;
        setExpandedYears(new Set([latestYear]));
        setExpandedMonths(new Set([`${latestYear}-${latestMonth}`]));
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // ── 選択モード ────────────────────────────────────────
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
  const deletePhotos = useCallback(async (ids: Set<number>) => {
    try {
      await albumApi.bulkDeletePhotos(Array.from(ids));
      setPhotos((prev) => prev.filter((p) => !ids.has(p.photoId)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setSelectedPhoto(null);
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  const updatePhoto = useCallback(async (updated: Photo) => {
    try {
      const saved = await albumApi.updatePhoto(updated.photoId, {
        groupId: updated.groupId ?? null,
        takenAt: updated.takenAt,
        location: updated.location,
        description: updated.description,
      });
      setPhotos((prev) => prev.map((p) => (p.photoId === saved.photoId ? saved : p)));
      setSelectedPhoto(saved);
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  const bulkUpdatePhotos = useCallback(async (
    ids: Set<number>,
    patch: { location?: string; description?: string },
  ) => {
    try {
      await albumApi.bulkUpdatePhotos(Array.from(ids), patch);
      setPhotos((prev) =>
        prev.map((p) => (ids.has(p.photoId) ? { ...p, ...patch } : p)),
      );
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  // ── フィルター済み ─────────────────────────────────────
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const d = p.takenAt ? new Date(p.takenAt) : new Date(p.createdAt);
      if (selectedDate.year  && d.getFullYear()  !== selectedDate.year)  return false;
      if (selectedDate.month && d.getMonth() + 1 !== selectedDate.month) return false;
      if (selectedDate.day   && d.getDate()       !== selectedDate.day)   return false;
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
    loading,
    error,
    toggleYear,
    toggleMonth,
    selectDate,
    updateFilter,
    clearFilter,
    fetchPhotos,
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
