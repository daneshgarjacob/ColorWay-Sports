// Fan vote storage, modeled on lib/grades/store.ts (same DATABASE_URL, its own
// table). One row per (item, anonymous browser id); the FIRST vote counts and
// a repeat from the same browser id is ignored (ON CONFLICT DO NOTHING).
//
//   DATABASE_URL set            -> Neon Postgres, table `votes`
//   not set, development        -> .data/votes.json (gitignored)
//   not set, production         -> no store: the API answers 503 and the
//                                  control says site votes are coming soon.
//
// The table is created on first use (same DDL as lib/votes/schema.sql).

import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import path from "node:path";
import type { Choice } from "./polls";

export type Counts = { a: number; b: number };

export interface VoteStore {
  /** Record one browser's vote (first vote wins), then return the counts. */
  cast(item: string, anonId: string, choice: Choice): Promise<Counts>;
  get(item: string): Promise<Counts>;
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
  };
}

// ---------- Local JSON file (development only) ----------

type FileShape = Record<string, Record<string, { choice: Choice; createdAt: string }>>;

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
  const countsOf = (rows: Record<string, { choice: Choice }> = {}): Counts => {
    const c: Counts = { a: 0, b: 0 };
    for (const r of Object.values(rows)) {
      if (r.choice === "A") c.a += 1;
      else if (r.choice === "B") c.b += 1;
    }
    return c;
  };

  return {
    cast: (item, anonId, choice) =>
      locked(async () => {
        const all = await read();
        const rows = (all[item] ??= {});
        if (!rows[anonId]) {
          rows[anonId] = { choice, createdAt: new Date().toISOString() };
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(file, JSON.stringify(all, null, 1));
        }
        return countsOf(rows);
      }),
    get: async (item) => countsOf((await read())[item]),
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
