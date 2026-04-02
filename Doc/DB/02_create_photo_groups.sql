-- ============================================================
-- PHOTO_GROUPS（グループ）テーブル作成
-- 依存 : users
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS photo_groups (
  group_id   BIGINT        NOT NULL AUTO_INCREMENT  COMMENT 'グループID',
  user_id    BIGINT        NOT NULL                 COMMENT 'ユーザーID',
  group_name VARCHAR(255)  NOT NULL                 COMMENT 'グループ名',
  comment    TEXT                   DEFAULT NULL    COMMENT 'グループコメント',
  sort_order INT                    DEFAULT NULL    COMMENT '並び順',
  created_at DATETIME      NOT NULL
             DEFAULT CURRENT_TIMESTAMP              COMMENT '作成日時',

  PRIMARY KEY (group_id),

  CONSTRAINT fk_photo_groups_user_id
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='グループ';
