-- ============================================================
-- INQUIRY_REPLIES（問い合わせ返信）テーブル作成
-- 依存 : inquiries, notices
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS inquiry_replies (
  reply_id    BIGINT   NOT NULL AUTO_INCREMENT  COMMENT '返信ID',
  inquiry_id  BIGINT   NOT NULL                 COMMENT '問い合わせID',
  body        TEXT     NOT NULL                 COMMENT '返信本文',
  target_type TINYINT  NOT NULL DEFAULT 0       COMMENT '配信先（0=個別返信, 1=全体お知らせ）',
  notice_id   BIGINT            DEFAULT NULL    COMMENT '全体投稿時のnotices ID（NULLは個別返信）',
  created_at  DATETIME NOT NULL
              DEFAULT CURRENT_TIMESTAMP         COMMENT '返信日時',

  PRIMARY KEY (reply_id),

  INDEX idx_inquiry_replies_inquiry_id (inquiry_id),

  CONSTRAINT fk_inquiry_replies_inquiry_id
    FOREIGN KEY (inquiry_id) REFERENCES inquiries (inquiry_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_inquiry_replies_notice_id
    FOREIGN KEY (notice_id) REFERENCES notices (notice_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='問い合わせ返信';
