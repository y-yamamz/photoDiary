-- ============================================================
-- USERS（ユーザー）テーブル作成
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  user_id    BIGINT        NOT NULL AUTO_INCREMENT  COMMENT 'ユーザーID',
  username   VARCHAR(100)  NOT NULL                 COMMENT 'ログインユーザー名',
  password   VARCHAR(255)  NOT NULL                 COMMENT 'パスワード（ハッシュ）',
  storage_limit_mb  INT  NOT NULL DEFAULT 500  COMMENT '容量上限(MB)',
  storage_used_bytes BIGINT NOT NULL DEFAULT 0  COMMENT '使用済み容量(bytes)',
  created_at DATETIME      NOT NULL
             DEFAULT CURRENT_TIMESTAMP              COMMENT '作成日時',
  updated_at DATETIME               DEFAULT NULL
             ON UPDATE CURRENT_TIMESTAMP            COMMENT '更新日時',

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザー';
