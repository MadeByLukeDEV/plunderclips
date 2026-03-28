-- Initial migration for SoT Clips (updated schema)
-- Run with: npm run db:migrate
-- Or manually: mysql -u user -p sot_clips < prisma/migrations/init.sql

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(191) NOT NULL,
  twitch_id VARCHAR(191) NOT NULL,
  twitch_login VARCHAR(191) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  profile_image VARCHAR(191),
  email VARCHAR(191),
  role ENUM('USER', 'ADMIN', 'MODERATOR') NOT NULL DEFAULT 'USER',
  youtube_channel_id VARCHAR(191),
  youtube_channel_name VARCHAR(191),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY users_twitch_id_key (twitch_id),
  UNIQUE KEY users_twitch_login_key (twitch_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- SESSIONS
-- =====================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY sessions_token_key (token(255)),
  KEY sessions_user_id_fkey (user_id),

  CONSTRAINT sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- CLIPS
-- =====================
CREATE TABLE IF NOT EXISTS clips (
  id VARCHAR(191) NOT NULL,
  twitch_clip_id VARCHAR(191) NOT NULL,
  twitch_url VARCHAR(500) NOT NULL,
  embed_url VARCHAR(500) NOT NULL,
  title VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  view_count INT NOT NULL DEFAULT 0,
  duration DOUBLE,
  submitted_by VARCHAR(191) NOT NULL,
  submitted_by_name VARCHAR(191) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
  platform ENUM('TWITCH','YOUTUBE','MEDAL') NOT NULL DEFAULT 'TWITCH',
  platform_verified BOOLEAN NOT NULL DEFAULT TRUE,
  game VARCHAR(191) NOT NULL DEFAULT 'Sea of Thieves',
  broadcaster_id VARCHAR(191) NOT NULL,
  broadcaster_name VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  reviewed_at DATETIME(3),
  reviewed_by VARCHAR(191),
  review_notes TEXT,

  PRIMARY KEY (id),
  UNIQUE KEY clips_twitch_clip_id_key (twitch_clip_id),
  KEY clips_submitted_by_fkey (submitted_by),

  CONSTRAINT clips_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- CLIP TAGS
-- =====================
CREATE TABLE IF NOT EXISTS clip_tags (
  id VARCHAR(191) NOT NULL,
  clip_id VARCHAR(191) NOT NULL,
  tag ENUM(
    'FUNNY','KILL','TUCK','HIGHLIGHT','PVP','PVE',
    'SAILING','TREASURE','KEG',
    'KRAKEN','MEGALODON','EPIC_FAIL','TEAM_PLAY','SOLO'
  ) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY clip_tags_clip_id_tag_key (clip_id, tag),

  CONSTRAINT clip_tags_clip_id_fkey 
    FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;