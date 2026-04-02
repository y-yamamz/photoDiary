-- ============================================================
-- PHOTOS（写真）テーブル作成
-- 依存 : users, photo_groups
-- DB     : MySQL 8.0+
-- 文字コード : utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS photos (
  photo_id    BIGINT        NOT NULL AUTO_INCREMENT  COMMENT '写真ID',
  user_id     BIGINT        NOT NULL                 COMMENT 'ユーザーID',
  group_id    BIGINT                 DEFAULT NULL    COMMENT 'グループID（任意）',
  file_path   VARCHAR(500)  NOT NULL                 COMMENT '画像ファイルパス',
  file_name   VARCHAR(255)           DEFAULT NULL    COMMENT '元ファイル名',
  taken_at    DATETIME               DEFAULT NULL    COMMENT '撮影日時（Exif）',
  location    VARCHAR(255)           DEFAULT NULL    COMMENT '撮影場所',
  description TEXT                   DEFAULT NULL    COMMENT '写真説明',
  sort_order  INT                    DEFAULT NULL    COMMENT '並び順',
  created_at  DATETIME      NOT NULL
              DEFAULT CURRENT_TIMESTAMP              COMMENT '登録日時',

  PRIMARY KEY (photo_id),

  CONSTRAINT fk_photos_user_id
    FOREIGN KEY (user_id)  REFERENCES users  (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_photos_group_id
    FOREIGN KEY (group_id) REFERENCES photo_groups (group_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_photos_user_id  (user_id),
  INDEX idx_photos_group_id (group_id),
  INDEX idx_photos_taken_at (taken_at)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='写真';
