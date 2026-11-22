// Fan vote storage, modeled on lib/grades/store.ts (same DATABASE_URL, its own
// table). One row per (item, anonymous browser id); the FIRST vote counts and
// a repeat from the same browser id is ignored (ON CONFLICT DO NOTHING).
//
//   DATABASE_URL set            -> Neon Postgres, table `votes` (A/B polls)
//                                  and table `poll_votes` (pick-one-of-many polls)
//   not set, development        -> .data/votes.json (gitignored)
//   not set, production         -> no store: the API answers 503 and the
//                                  control says site votes are coming soon.
//
// The tables are created on first use (same DDL as lib/votes/schema.sql).

import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import path from "node:path";
import type { Choice } from "./polls";

export type Counts = { a: number; b: number };
/** Votes per option key, for a pick-one-of-many poll (only keys that have votes). */
export type OptionCounts = Record<string, number>;

export interface VoteStore {
  /** Record one browser's vote (first vote wins), then return the counts. */
  cast(item: string, anonId: string, choice: Choice): Promise<Counts>;
  get(item: string): Promise<Counts>;
  /** Pick-one-of-many: record one browser's vote for an option key (first vote wins). The API checks the key. */
  castOption(item: string, anonId: string, key: string): Promise<OptionCounts>;
  getOptions(item: string): Promise<OptionCounts>;
}

// ---------- Neon ----------

const DDL = [
  `CREATE TABLE IF NOT EXISTS votes (
    item text NOT NULL,
    anon_id text NOT NULL,
    choice text NOT NULL CHECK (choice IN ('A','B')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (item, anon_id)
  )`,
  `CREATE INDEX IF NOT EXISTS votes_item_idx ON votes (item)`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    item text NOT NULL,
    anon_id text NOT NULL,
    choice text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (item, anon_id)
  )`,
  `CREATE INDEX IF NOT EXISTS poll_votes_item_idx ON poll_votes (item)`,
];

function neonStore(url: string): VoteStore {
  // Plain q.query(text, params), as in lib/grades/store.ts (the tagged-template
  // form broke in the production bundle).
  const q = neon(url);
  let ready: Promise<void> | null = null;
  const init = () =>
    (ready ??= (async () => {
      for (const stmt of DDL) await q.query(stmt);
    })().catch((e) => {
      ready = null;
      throw e;
    }));

  const countsFor = async (item: string): Promise<Counts> => {
    await init();
    const rows = (await q.query("SELECT choice, count(*)::int AS n FROM votes WHERE item = $1 GROUP BY choice", [item])) as {
      choice: Choice;
      n: number;
    }[];
    const c: Counts = { a: 0, b: 0 };
    for (const r of rows) {
      if (r.choice === "A") c.a = r.n;
      else if (r.choice === "B") c.b = r.n;
    }
    return c;
  };

  const optionCountsFor = async (item: string): Promise<OptionCounts> => {
    await init();
    const rows = (await q.query("SELECT choice, count(*)::int AS n FROM poll_votes WHERE item = $1 GROUP BY choice", [item])) as {
      choice: string;
      n: number;
    }[];
    const c: OptionCounts = {};
    for (const r of rows) c[r.choice] = r.n;
    return c;
  };

  return {
    async cast(item, anonId, choice) {
      await init();
      await q.query(
        `INSERT INTO votes (item, anon_id, choice) VALUES ($1, $2, $3) ON CONFLICT (item, anon_id) DO NOTHING`,
        [item, anonId, choice]
      );
      return countsFor(item);
    },
    get: countsFor,
    async castOption(item, anonId, key) {
      await init();
      await q.query(
        `INSERT INTO poll_votes (item, anon_id, choice) VALUES ($1, $2, $3) ON CONFLICT (item, anon_id) DO NOTHING`,
        [item, anonId, key]
      );
      return optionCountsFor(item);
    },
    getOptions: optionCountsFor,
  };
}

// ---------- Local JSON file (development only) ----------

// One file for both kinds of poll (item ids never overlap): choice is "A"/"B"
// for a head-to-head poll and an option key for a pick-one-of-many poll.
type FileShape = Record<string, Record<string, { choice: string; createdAt: string }>>;

function fileStore(): VoteStore {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "votes.json");
  let chain: Promise<unknown> = Promise.resolve();
  const locked = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
  const read = async (): Promise<FileShape> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as FileShape;
    } catch {
      return {};
    }
  };
  const optionCountsOf = (rows: Record<string, { choice: string }> = {}): OptionCounts => {
    const c: OptionCounts = {};
    for (const r of Object.values(rows)) c[r.choice] = (c[r.choice] ?? 0) + 1;
    return c;
  };
  const record = (item: string, anonId: string, choice: string) =>
    locked(async () => {
      const all = await read();
      const rows = (all[item] ??= {});
      if (!rows[anonId]) {
        rows[anonId] = { choice, createdAt: new Date().toISOString() };
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, JSON.stringify(all, null, 1));
      }
      return rows;
    });
  const countsOf = (rows: Record<string, { choice: string }> = {}): Counts => {
    const c: Counts = { a: 0, b: 0 };
    for (const r of Object.values(rows)) {
      if (r.choice === "A") c.a += 1;
      else if (r.choice === "B") c.b += 1;
    }
    return c;
  };

  return {
    cast: async (item, anonId, choice) => countsOf(await record(item, anonId, choice)),
    get: async (item) => countsOf((await read())[item]),
    castOption: async (item, anonId, key) => optionCountsOf(await record(item, anonId, key)),
    getOptions: async (item) => optionCountsOf((await read())[item]),
  };
}

// ---------- Selection ----------

let store: VoteStore | null | undefined;

/** The configured store, or null when there is none (production without DATABASE_URL). */
export function voteStore(): VoteStore | null {
  if (store !== undefined) return store;
  const url = process.env.DATABASE_URL;
  if (url) store = neonStore(url);
  else if (process.env.NODE_ENV !== "production") store = fileStore();
  else store = null;
  return store;
}
