-- PathwayHQ MySQL Schema
-- Run this in phpMyAdmin or MySQL CLI after creating a database named `pathwayhq`

CREATE DATABASE IF NOT EXISTS pathwayhq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pathwayhq;

-- CLUBS
CREATE TABLE clubs (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name          VARCHAR(255) NOT NULL,
  sport         VARCHAR(100) NOT NULL,
  city          VARCHAR(100),
  state         VARCHAR(10),
  slug          VARCHAR(255) UNIQUE,
  description   TEXT,
  website       VARCHAR(255),
  contact_email VARCHAR(255),
  is_public     BOOLEAN DEFAULT FALSE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USERS
CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id       CHAR(36),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255),
  role          ENUM('site_admin','club_admin','coach','athlete','parent') DEFAULT 'coach',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
);

-- ATHLETES
CREATE TABLE athletes (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id       CHAR(36) NOT NULL,
  user_id       CHAR(36),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  dob           DATE,
  sport         VARCHAR(100),
  gender        ENUM('male','female','other'),
  ftem_phase    VARCHAR(10) DEFAULT 'F1',
  is_active     BOOLEAN DEFAULT TRUE,
  notes         TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- SQUADS
CREATE TABLE squads (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id     CHAR(36) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- SQUAD MEMBERS
CREATE TABLE squad_athletes (
  squad_id    CHAR(36) NOT NULL,
  athlete_id  CHAR(36) NOT NULL,
  PRIMARY KEY (squad_id, athlete_id),
  FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- EVENTS (Calendar)
CREATE TABLE events (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id     CHAR(36) NOT NULL,
  squad_id    CHAR(36),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  location    VARCHAR(255),
  start_time  DATETIME NOT NULL,
  end_time    DATETIME,
  event_type  ENUM('training','match','camp','other') DEFAULT 'training',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE SET NULL
);

-- MILESTONES
CREATE TABLE milestones (
  id                    CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id               CHAR(36) NOT NULL,
  athlete_id            CHAR(36) NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  ftem_phase            VARCHAR(10),
  achieved_at           DATE NOT NULL,
  is_shared_with_parent BOOLEAN DEFAULT FALSE,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id    CHAR(36) NOT NULL,
  author_id  CHAR(36),
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- VOLUNTEERING
CREATE TABLE volunteering (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  club_id     CHAR(36) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  date        DATE,
  spots       INT DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- VOLUNTEERING SIGNUPS
CREATE TABLE volunteering_signups (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  volunteering_id CHAR(36) NOT NULL,
  user_id         CHAR(36) NOT NULL,
  signed_up_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteering_id) REFERENCES volunteering(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  link       VARCHAR(255),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ATHLETE PARENTS LINK
CREATE TABLE athlete_parents (
  athlete_id CHAR(36) NOT NULL,
  parent_id  CHAR(36) NOT NULL,
  PRIMARY KEY (athlete_id, parent_id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_athletes_club ON athletes(club_id);
CREATE INDEX idx_athletes_active ON athletes(club_id, is_active);
CREATE INDEX idx_events_club ON events(club_id, start_time);
CREATE INDEX idx_milestones_club ON milestones(club_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_users_club ON users(club_id);
