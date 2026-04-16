-- ============================================================
-- NOTICE_READS（お知らせ既読管理）テーブル作成
-- 依存 : notices, users
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS notice_reads (
  notice_id BIGINT   NOT NULL  COMMENT 'お知らせID',
  user_id   BIGINT   NOT NULL  COMMENT 'ユーザーID',
  read_at   DATETIME NOT NULL
            DEFAULT CURRENT_TIMESTAMP  COMMENT '既読日時',

  PRIMARY KEY (notice_id, user_id),

  CONSTRAINT fk_notice_reads_notice_id
    FOREIGN KEY (notice_id) REFERENCES notices (notice_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_notice_reads_user_id
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='お知らせ既読管理';
