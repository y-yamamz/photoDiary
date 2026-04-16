-- ============================================================
-- NOTICES（お知らせ）テーブル作成
-- 依存 : なし
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS notices (
  notice_id  BIGINT        NOT NULL AUTO_INCREMENT  COMMENT 'お知らせID',
  title      VARCHAR(255)  NOT NULL                 COMMENT 'タイトル',
  body       TEXT          NOT NULL                 COMMENT '本文',
  created_at DATETIME      NOT NULL
             DEFAULT CURRENT_TIMESTAMP              COMMENT '作成日時',
  updated_at DATETIME               DEFAULT NULL
             ON UPDATE CURRENT_TIMESTAMP            COMMENT '更新日時',

  PRIMARY KEY (notice_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='お知らせ';
