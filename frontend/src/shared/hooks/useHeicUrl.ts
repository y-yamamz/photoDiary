import { useState, useEffect } from 'react';

// 変換済み URL をメモリキャッシュ（同じ画像を二度変換しない）
const heicCache = new Map<string, string>();

/**
 * HEIC 画像を JPEG の Object URL に変換して返す。
 * HEIC 以外はそのまま返す。
 */
export const useHeicUrl = (src: string) => {
  const isHeic = /\.heic$/i.test(src);
  const [url, setUrl] = useState<string>(isHeic ? '' : src);
  const [loading, setLoading] = useState(isHeic);

  useEffect(() => {
    if (!isHeic) {
      setUrl(src);
      setLoading(false);
      return;
    }

    if (heicCache.has(src)) {
      setUrl(heicCache.get(src)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.85 });
        const objectUrl = URL.createObjectURL(converted as Blob);
        heicCache.set(src, objectUrl);
        setUrl(objectUrl);
      } catch {
        // 変換失敗時はオリジナル URL にフォールバック
        setUrl(src);
      } finally {
        setLoading(false);
      }
    })();
  }, [src, isHeic]);

  return { url, loading };
};
