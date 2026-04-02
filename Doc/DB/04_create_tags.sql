-- ============================================================
-- TAGS（タグ）テーブル作成
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS tags (
  tag_id   BIGINT        NOT NULL AUTO_INCREMENT  COMMENT 'タグID',
  tag_name VARCHAR(100)  NOT NULL                 COMMENT 'タグ名',

  PRIMARY KEY (tag_id),
  UNIQUE KEY uq_tags_tag_name (tag_name)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='タグ';
