-- Grade It storage (Neon Postgres). One row per (item, anonymous browser id);
-- a reader changing their grade updates the row, never adds a second vote.
-- Run once in the Neon SQL editor (lib/grades/store.ts also runs this on first
-- use, so a fresh database works without it).
--
-- item    "jotd:2026-11-10" (Jersey of the Day, keyed by Eastern date)
-- anon_id random UUID the browser keeps in localStorage; no personal data
-- grade   one of A+ A A- B+ B B- C+ C C- D+ D D- F

CREATE TABLE IF NOT EXISTS grades (
  item        text        NOT NULL,
  anon_id     text        NOT NULL,
  grade       text        NOT NULL CHECK (grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item, anon_id)
);

CREATE INDEX IF NOT EXISTS grades_item_idx ON grades (item);
