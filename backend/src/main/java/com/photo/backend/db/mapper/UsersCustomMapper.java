package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Users;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ユーザーのカスタムSQL操作。
 * 自動生成Mapperでは対応できないアトミック更新や集計クエリを扱う。
 */
@Mapper
public interface UsersCustomMapper {

    /**
     * storage_used_bytes を指定値で直接上書きする（再計算・補正用）。
     * 通常の増減には addStorageUsed を使うこと。
     *
     * @param userId 対象ユーザーID
     * @param bytes  設定するバイト数（0以上）
     * @return 更新件数
     */
    int setStorageUsed(@Param("userId") Long userId, @Param("bytes") long bytes);

    /**
     * storage_used_bytes を delta 分だけアトミックに増減させる。
     * アップロード時は正の値（加算）、削除時は負の値（減算）を渡す。
     * 0 未満にはならないよう GREATEST(0, ...) で保護する。
     *
     * @param userId 対象ユーザーID
     * @param delta  増減バイト数（削除時は負数）
     * @return 更新件数
     */
    int addStorageUsed(@Param("userId") Long userId, @Param("delta") long delta);

    /**
     * storage_limit_mb を更新する（管理者操作）。
     *
     * @param userId  対象ユーザーID
     * @param limitMb 新しい上限（MB）
     * @return 更新件数
     */
    int updateStorageLimit(@Param("userId") Long userId, @Param("limitMb") int limitMb);

    /**
     * 全ユーザーの容量情報を取得する（管理者向け一覧）。
     *
     * @return 全ユーザーリスト（storage_limit_mb, storage_used_bytes 含む）
     */
    List<Users> selectAllWithStorage();

    /**
     * 有効ユーザー（active_flag = 1）の人数を返す。
     * 新規登録の上限チェックに使用する。
     *
     * @return 有効ユーザー数
     */
    int countActiveUsers();
}
