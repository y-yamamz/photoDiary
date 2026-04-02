import { formatFileSize } from '../../../shared/utils';

export { formatFileSize };

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'JPEG / PNG / WebP / HEIC 形式のみ対応しています';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `ファイルサイズは ${formatFileSize(MAX_FILE_SIZE)} 以下にしてください（現在: ${formatFileSize(file.size)}）`;
  }
  return null;
};

export const createPreviewUrl = (file: File): string =>
  URL.createObjectURL(file);

export const revokePreviewUrl = (url: string) =>
  URL.revokeObjectURL(url);
