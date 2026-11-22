CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  student_id    VARCHAR(50) UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A student belongs to at most one group (UNIQUE user_id)
CREATE TABLE IF NOT EXISTS group_members (
  id        SERIAL PRIMARY KEY,
  group_id  INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  due_date      TIMESTAMPTZ NOT NULL,
  onedrive_link TEXT NOT NULL,
  assign_to     VARCHAR(10) NOT NULL DEFAULT 'all' CHECK (assign_to IN ('all', 'groups')),
  created_by    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only used when assignments.assign_to = 'groups'
CREATE TABLE IF NOT EXISTS assignment_groups (
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, group_id)
);

-- One confirmation per (assignment, group), recording which member confirmed
CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  confirmed_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group ON submissions(group_id);
