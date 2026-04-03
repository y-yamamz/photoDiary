import { formatFileSize } from '../../../shared/utils';

export { formatFileSize };

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const getExtension = (name: string) =>
  name.slice(name.lastIndexOf('.')).toLowerCase();

export const validateImageFile = (file: File): string | null => {
  const byType = ACCEPTED_TYPES.includes(file.type);
  const byExt  = ACCEPTED_EXTENSIONS.includes(getExtension(file.name));
  if (!byType && !byExt) {
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
