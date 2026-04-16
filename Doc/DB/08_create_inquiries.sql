-- ============================================================
-- INQUIRIES（問い合わせ）テーブル作成
-- 依存 : users
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS inquiries (
  inquiry_id BIGINT        NOT NULL AUTO_INCREMENT  COMMENT '問い合わせID',
  user_id    BIGINT        NOT NULL                 COMMENT '送信ユーザーID',
  subject    VARCHAR(255)  NOT NULL                 COMMENT '件名',
  body       TEXT          NOT NULL                 COMMENT '本文',
  status     TINYINT       NOT NULL DEFAULT 0       COMMENT '状態（0=未対応, 1=対応済み）',
  created_at DATETIME      NOT NULL
             DEFAULT CURRENT_TIMESTAMP              COMMENT '送信日時',
  updated_at DATETIME               DEFAULT NULL
             ON UPDATE CURRENT_TIMESTAMP            COMMENT '更新日時',

  PRIMARY KEY (inquiry_id),

  INDEX idx_inquiries_user_id (user_id),
  INDEX idx_inquiries_status  (status),

  CONSTRAINT fk_inquiries_user_id
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='問い合わせ';
