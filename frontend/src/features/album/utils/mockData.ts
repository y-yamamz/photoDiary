import type { Photo, Group } from '../../../shared/types';
import { mockImageUrl } from '../../../shared/utils';

export const MOCK_GROUPS: Group[] = [
  { groupId: 1, userId: 1, groupName: '旅行', comment: '旅の思い出', sortOrder: 1, createdAt: '2025-01-01T00:00:00' },
  { groupId: 2, userId: 1, groupName: '家族', comment: '大切な家族の記録', sortOrder: 2, createdAt: '2025-01-01T00:00:00' },
  { groupId: 3, userId: 1, groupName: '日常', comment: '毎日の小さな幸せ', sortOrder: 3, createdAt: '2025-01-01T00:00:00' },
  { groupId: 4, userId: 1, groupName: 'イベント', comment: 'お祭り・行事', sortOrder: 4, createdAt: '2025-01-01T00:00:00' },
];

export const MOCK_PHOTOS: Photo[] = [
  // 2026/04
  { photoId: 1, userId: 1, groupId: 1, filePath: mockImageUrl('tokyo-2026', 800, 600), fileName: 'tokyo_001.jpg', takenAt: '2026-04-01T10:30:00', location: '東京タワー', description: '春の東京散歩', createdAt: '2026-04-01T12:00:00', tags: [{ tagId: 1, tagName: '東京' }, { tagId: 2, tagName: '春' }] },
  { photoId: 2, userId: 1, groupId: 1, filePath: mockImageUrl('sakura-2026', 800, 600), fileName: 'sakura_001.jpg', takenAt: '2026-04-01T14:00:00', location: '上野公園', description: '満開の桜', createdAt: '2026-04-01T15:00:00', tags: [{ tagId: 2, tagName: '春' }, { tagId: 3, tagName: '桜' }] },
  { photoId: 3, userId: 1, groupId: 2, filePath: mockImageUrl('family-spring', 800, 600), fileName: 'family_001.jpg', takenAt: '2026-04-02T11:00:00', location: '代々木公園', description: '家族でお花見', createdAt: '2026-04-02T12:00:00', tags: [{ tagId: 2, tagName: '春' }] },
  { photoId: 4, userId: 1, groupId: 3, filePath: mockImageUrl('daily-01', 800, 600), fileName: 'daily_001.jpg', takenAt: '2026-04-02T17:30:00', location: '渋谷', description: '夕暮れの渋谷', createdAt: '2026-04-02T18:00:00', tags: [] },
  // 2026/03
  { photoId: 5, userId: 1, groupId: 1, filePath: mockImageUrl('kyoto-march', 800, 600), fileName: 'kyoto_001.jpg', takenAt: '2026-03-15T09:00:00', location: '京都・金閣寺', description: '京都旅行', createdAt: '2026-03-15T10:00:00', tags: [{ tagId: 4, tagName: '京都' }, { tagId: 5, tagName: '旅行' }] },
  { photoId: 6, userId: 1, groupId: 1, filePath: mockImageUrl('kyoto-march2', 800, 600), fileName: 'kyoto_002.jpg', takenAt: '2026-03-15T13:00:00', location: '京都・嵐山', description: '嵐山の竹林', createdAt: '2026-03-15T14:00:00', tags: [{ tagId: 4, tagName: '京都' }] },
  { photoId: 7, userId: 1, groupId: 4, filePath: mockImageUrl('event-march', 800, 600), fileName: 'event_001.jpg', takenAt: '2026-03-20T18:00:00', location: '横浜', description: '春のコンサート', createdAt: '2026-03-20T20:00:00', tags: [{ tagId: 6, tagName: '音楽' }] },
  { photoId: 8, userId: 1, groupId: 3, filePath: mockImageUrl('daily-feb', 800, 600), fileName: 'daily_002.jpg', takenAt: '2026-03-28T08:30:00', location: '近所', description: '朝の散歩', createdAt: '2026-03-28T09:00:00', tags: [] },
  // 2026/02
  { photoId: 9, userId: 1, groupId: 2, filePath: mockImageUrl('family-feb', 800, 600), fileName: 'family_002.jpg', takenAt: '2026-02-14T12:00:00', location: '自宅', description: 'バレンタイン', createdAt: '2026-02-14T13:00:00', tags: [{ tagId: 7, tagName: 'バレンタイン' }] },
  { photoId: 10, userId: 1, groupId: 1, filePath: mockImageUrl('travel-feb', 800, 600), fileName: 'trip_001.jpg', takenAt: '2026-02-20T10:00:00', location: '北海道', description: '雪景色', createdAt: '2026-02-20T12:00:00', tags: [{ tagId: 8, tagName: '北海道' }, { tagId: 9, tagName: '冬' }] },
  // 2025/12
  { photoId: 11, userId: 1, groupId: 4, filePath: mockImageUrl('xmas-2025', 800, 600), fileName: 'xmas_001.jpg', takenAt: '2025-12-25T19:00:00', location: '六本木', description: 'クリスマスイルミネーション', createdAt: '2025-12-25T20:00:00', tags: [{ tagId: 10, tagName: 'クリスマス' }] },
  { photoId: 12, userId: 1, groupId: 2, filePath: mockImageUrl('newyear-prep', 800, 600), fileName: 'newyear_001.jpg', takenAt: '2025-12-31T23:00:00', location: '神社', description: '年越し参拝', createdAt: '2025-12-31T23:30:00', tags: [] },
];

/** toChipStyle: タグ名からチップスタイルを返す */
export const toChipStyle = (tagName: string) => {
  const colorMap: Record<string, { bg: string; color: string }> = {
    '東京': { bg: 'rgba(59,130,246,0.2)', color: '#93c5fd' },
    '春': { bg: 'rgba(244,114,182,0.2)', color: '#f9a8d4' },
    '桜': { bg: 'rgba(244,114,182,0.3)', color: '#fce7f3' },
    '京都': { bg: 'rgba(234,179,8,0.2)', color: '#fde047' },
    '旅行': { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7' },
    '北海道': { bg: 'rgba(147,197,253,0.2)', color: '#bfdbfe' },
    '冬': { bg: 'rgba(148,163,184,0.2)', color: '#cbd5e1' },
    'クリスマス': { bg: 'rgba(239,68,68,0.2)', color: '#fca5a5' },
    '音楽': { bg: 'rgba(167,139,250,0.2)', color: '#c4b5fd' },
    'バレンタイン': { bg: 'rgba(244,63,94,0.2)', color: '#fb7185' },
  };
  return colorMap[tagName] ?? { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' };
};
