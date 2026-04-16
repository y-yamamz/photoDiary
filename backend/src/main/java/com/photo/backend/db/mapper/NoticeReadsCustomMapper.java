package com.photo.backend.db.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * notice_reads テーブルのカスタムSQL操作。
 *
 * 自動生成 NoticeReadsMapper では対応できない
 * 一括 INSERT IGNORE と未読件数集計クエリを提供する。
 */
@Mapper
public interface NoticeReadsCustomMapper {

    /**
     * 指定ユーザーの未読お知らせ件数を返す。
     *
     * notices テーブルの全件から、
     * notice_reads に当該ユーザーの既読レコードが存在しないものをカウントする。
     * AlbumPage ヘッダーの未読バッジ件数取得に使用する。
     *
     * @param userId 対象ユーザーID
     * @return 未読お知らせ件数
     */
    int countUnread(@Param("userId") Long userId);

    /**
     * 複数のお知らせを一括で既読登録する（INSERT IGNORE）。
     *
     * すでに既読のレコードが存在する場合は無視する（重複エラーにならない）。
     * ユーザーがお知らせ一覧を開いた際に、表示された全件を一括既読化するために使用する。
     *
     * @param noticeIds 既読にするお知らせIDのリスト
     * @param userId    対象ユーザーID
     */
    void bulkInsertIgnore(@Param("noticeIds") List<Long> noticeIds,
                          @Param("userId") Long userId);
}
