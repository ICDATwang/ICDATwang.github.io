CREATE TABLE IF NOT EXISTS likes (
  page_key TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_key, visitor_id)
);

CREATE INDEX IF NOT EXISTS likes_page_key_idx
  ON likes (page_key);
