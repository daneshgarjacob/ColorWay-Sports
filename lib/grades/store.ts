// Grade It storage adapter. One row per (item, anonymous browser id).
//
//   DATABASE_URL set            -> Neon Postgres (@neondatabase/serverless, HTTP
//                                  queries, no connection pool to keep warm).
//   not set, development        -> a local JSON file, .data/grades.json
//                                  (gitignored), so the control can be tested
//                                  without a database.
//   not set, production         -> no store: the API answers 503, the control
//                                  keeps the reader's grade in localStorage and
//                                  says fan grades are coming soon. Never throws
//                                  into the page.
//
// The table is created on first use when it is missing (same DDL as
// lib/grades/schema.sql; keep the two in sync).

import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import path from "node:path";
import { aggregate, emptyCounts, type Aggregate, type Counts, type Grade } from "./grade";

export interface GradeStore {
  /** Insert or update one reader's grade, then return the item's aggregate. */
  upsert(item: string, anonId: string, grade: Grade): Promise<Aggregate>;
  get(item: string): Promise<Aggregate>;
}

// ---------- Neon ----------

const DDL = [
  `CREATE TABLE IF NOT EXISTS grades (
    item text NOT NULL,
    anon_id text NOT NULL,
    grade text NOT NULL CHECK (grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (item, anon_id)
  )`,
  `CREATE INDEX IF NOT EXISTS grades_item_idx ON grades (item)`,
];

function neonStore(url: string): GradeStore {
  // Plain sql.query(text, params) calls rather than tagged templates: the
  // template form broke in the production bundle ("s(...) is not a function").
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
    const rows = (await q.query("SELECT grade, count(*)::int AS n FROM grades WHERE item = $1 GROUP BY grade", [item])) as {
      grade: Grade;
      n: number;
    }[];
    const counts = emptyCounts();
    for (const r of rows) counts[r.grade] = r.n;
    return counts;
  };

  return {
    async upsert(item, anonId, grade) {
      await init();
      await q.query(
        `INSERT INTO grades (item, anon_id, grade) VALUES ($1, $2, $3)
        ON CONFLICT (item, anon_id) DO UPDATE SET grade = EXCLUDED.grade, updated_at = now()`,
        [item, anonId, grade]
      );
      return aggregate(item, await countsFor(item));
    },
    async get(item) {
      return aggregate(item, await countsFor(item));
    },
  };
}

// ---------- Local JSON file (development only) ----------

type FileShape = Record<string, Record<string, { grade: Grade; createdAt: string; updatedAt: string }>>;

function fileStore(): GradeStore {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "grades.json");
  // Writes are serialized so two taps in the same tick cannot clobber each other.
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
  const countsOf = (rows: Record<string, { grade: Grade }> = {}): Counts => {
    const counts = emptyCounts();
    for (const r of Object.values(rows)) counts[r.grade] += 1;
    return counts;
  };

  return {
    upsert: (item, anonId, grade) =>
      locked(async () => {
        const all = await read();
        const now = new Date().toISOString();
        const rows = (all[item] ??= {});
        rows[anonId] = { grade, createdAt: rows[anonId]?.createdAt ?? now, updatedAt: now };
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, JSON.stringify(all, null, 1));
        return aggregate(item, countsOf(rows));
      }),
    get: async (item) => aggregate(item, countsOf((await read())[item])),
  };
}

// ---------- Selection ----------

let store: GradeStore | null | undefined;

/** The configured store, or null when there is none (production without DATABASE_URL). */
export function gradeStore(): GradeStore | null {
  if (store !== undefined) return store;
  const url = process.env.DATABASE_URL;
  if (url) store = neonStore(url);
  else if (process.env.NODE_ENV !== "production") store = fileStore();
  else store = null;
  return store;
}
