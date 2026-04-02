import dayjs from 'dayjs';
import { Photo, DateTreeNode } from '../types';

// ============================================================
// 共通ユーティリティ
// ============================================================

/** 日付フォーマット */
export const formatDate = (date?: string, fmt = 'YYYY/MM/DD') =>
  date ? dayjs(date).format(fmt) : '—';

/** 写真リストから日付ツリーを構築 */
export const buildDateTree = (photos: Photo[]): DateTreeNode[] => {
  const map = new Map<number, Map<number, Set<number>>>();

  photos.forEach((p) => {
    const d = dayjs(p.takenAt ?? p.createdAt);
    const y = d.year();
    const m = d.month() + 1;
    const day = d.date();

    if (!map.has(y)) map.set(y, new Map());
    const mMap = map.get(y)!;
    if (!mMap.has(m)) mMap.set(m, new Set());
    mMap.get(m)!.add(day);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, mMap]) => ({
      year,
      months: Array.from(mMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([month, days]) => ({
          month,
          days: Array.from(days).sort((a, b) => b - a),
        })),
    }));
};

/** ファイルサイズ表示 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/** モック画像 URL（Unsplash） */
export const mockImageUrl = (seed: number | string, w = 400, h = 300) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
