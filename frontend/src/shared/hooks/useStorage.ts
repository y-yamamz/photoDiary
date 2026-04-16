import { useState, useCallback, useEffect } from 'react';
import { userApi } from '../api/userApi';
import type { StorageInfo } from '../types';

/**
 * ストレージ使用量を取得・更新するhook。
 * UploadPage / AlbumPage など複数箇所で共用する。
 */
export const useStorage = () => {
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const refresh = useCallback(() => {
    userApi.getMyStorage()
      .then(setStorage)
      .catch(() => setStorage(null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { storage, refresh };
};
