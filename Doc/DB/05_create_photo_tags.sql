-- ============================================================
-- PHOTO_TAGS（写真タグ紐付け）テーブル作成
-- 依存 : photos, tags
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id BIGINT NOT NULL COMMENT '写真ID',
  tag_id   BIGINT NOT NULL COMMENT 'タグID',

  PRIMARY KEY (photo_id, tag_id),

  CONSTRAINT fk_photo_tags_photo_id
    FOREIGN KEY (photo_id) REFERENCES photos (photo_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_photo_tags_tag_id
    FOREIGN KEY (tag_id)   REFERENCES tags   (tag_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='写真タグ紐付け';
