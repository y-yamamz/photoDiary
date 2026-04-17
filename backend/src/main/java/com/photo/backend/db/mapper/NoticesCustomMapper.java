package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Notices;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * notices テーブルのカスタムSQL操作。
 *
 * 自動生成 NoticesMapper では対応できない
 * ユーザー別フィルタリングクエリを提供する。
 */
@Mapper
public interface NoticesCustomMapper {

    /**
     * 指定ユーザー向けのお知らせ一覧を新しい順で取得する。
     *
     * 全体配信（target_user_id IS NULL）と
     * 当該ユーザー宛の個人通知（target_user_id = userId）を両方返す。
     *
     * @param userId 対象ユーザーID
     * @return お知らせ一覧（body含む、created_at DESC）
     */
    List<Notices> selectForUserWithBLOBs(@Param("userId") Long userId);
}
