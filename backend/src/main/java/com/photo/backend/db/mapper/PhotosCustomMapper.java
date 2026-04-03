package com.photo.backend.db.mapper;

import com.photo.backend.dto.response.PhotoResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 生成Mapperでは対応できない複雑なSQLを管理するカスタムMapper。
 * - タグJOINを含む写真一覧取得
 * - 一括削除・一括更新
 */
@Mapper
public interface PhotosCustomMapper {

    /**
     * タグ情報を含む写真一覧を取得する（フィルター対応）。
     */
    List<PhotoResponse> selectPhotosWithTags(
            @Param("userId") Long userId,
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("day") Integer day,
            @Param("groupId") Long groupId,
            @Param("keyword") String keyword
    );

    /**
     * 指定IDリストの写真を一括削除する（ユーザー所有確認付き）。
     */
    int bulkDeleteByIds(@Param("userId") Long userId, @Param("ids") List<Long> ids);

    /**
     * 指定IDリストの写真の場所・説明を一括更新する。
     * nullのフィールドは更新しない。
     */
    int bulkUpdateByIds(
            @Param("userId") Long userId,
            @Param("ids") List<Long> ids,
            @Param("location") String location,
            @Param("description") String description
    );
}
