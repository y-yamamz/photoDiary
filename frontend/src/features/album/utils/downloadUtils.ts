import JSZip from 'jszip';
import type { Photo } from '../../../shared/types';

/**
 * 選択された写真をZIP圧縮してダウンロードする。
 * @param photos ダウンロード対象の写真リスト
 * @param onProgress 進捗コールバック (完了枚数, 総枚数)
 */
export const downloadPhotosAsZip = async (
  photos: Photo[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> => {
  const zip = new JSZip();

  // ファイル名の重複を避けるためカウンタ管理
  const nameCount: Record<string, number> = {};

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      const response = await fetch(photo.filePath);
      const blob = await response.blob();

      // ファイル名の決定（重複時は連番サフィックスを付与）
      const baseName = photo.fileName ?? `photo_${photo.photoId}.jpg`;
      nameCount[baseName] = (nameCount[baseName] ?? 0) + 1;
      const fileName =
        nameCount[baseName] === 1
          ? baseName
          : baseName.replace(/(\.[^.]+)$/, `_${nameCount[baseName]}$1`);

      zip.file(fileName, blob);
    } catch {
      console.error(`取得失敗: ${photo.fileName ?? photo.photoId}`);
    }

    onProgress?.(i + 1, photos.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const zipFileName = `photos_${timestamp}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
