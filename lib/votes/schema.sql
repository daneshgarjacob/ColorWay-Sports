-- Fan votes (Neon Postgres), same database as Grade It (lib/grades/schema.sql).
-- One row per (item, anonymous browser id); the first vote counts.
-- lib/votes/store.ts runs this on first use, so a fresh database works without it.
--
-- item    "tg26:r1-m1" (must be listed in lib/votes/polls.ts)
-- anon_id random UUID the browser keeps in localStorage (shared with Grade It); no personal data
-- choice  'A' or 'B'

CREATE TABLE IF NOT EXISTS votes (
  item        text        NOT NULL,
  anon_id     text        NOT NULL,
  choice      text        NOT NULL CHECK (choice IN ('A','B')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item, anon_id)
);

CREATE INDEX IF NOT EXISTS votes_item_idx ON votes (item);
