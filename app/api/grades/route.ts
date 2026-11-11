import { NextResponse, type NextRequest } from "next/server";
import { isGrade, type Aggregate } from "@/lib/grades/grade";
import { gradeStore } from "@/lib/grades/store";
import { entryForItem } from "@/lib/jerseyOfTheDay";

// Grade It API (components/GradeIt.tsx).
//
//   GET  /api/grades?item=jotd:2026-11-10   -> the fan aggregate, CDN-cached a minute
//   POST /api/grades {item, grade, anon}     -> upsert this browser's grade, return the aggregate
//
// Readers who never tap never hit this route: the control is rendered with
// the page and only calls here after a tap (or on load when this browser has
// graded the item before). No store configured in production = 503 and the
// control fails soft (see lib/grades/store.ts).

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 512;
const BOT_UA = /bot|crawl|spider|slurp|fetch|headless|curl|wget|python|preview/i;

// Per-IP rate limit, in memory (per serverless instance; good enough to blunt
// a loop, not a security boundary). 40 writes a minute is far beyond any
// reader changing their mind.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    if (hits.size > 5_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  h.n += 1;
  return h.n > MAX_PER_WINDOW;
}

const ipOf = (req: NextRequest) =>
  req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

const unavailable = () =>
  NextResponse.json({ error: "Fan grades are not available yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });

const ok = (agg: Aggregate, cache: string) => NextResponse.json(agg, { headers: { "Cache-Control": cache } });

export async function GET(request: NextRequest) {
  const item = request.nextUrl.searchParams.get("item") ?? "";
  if (!entryForItem(item)) return bad("Unknown item.", 404);
  const store = gradeStore();
  if (!store) return unavailable();
  try {
    return ok(await store.get(item), "public, s-maxage=60, stale-while-revalidate=300");
  } catch (e) {
    console.log(`[Grades] GET ${item} failed: ${(e as Error).message}`);
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  if (BOT_UA.test(request.headers.get("user-agent") ?? "") || !request.headers.get("user-agent")) {
    return bad("Not accepted.", 403);
  }
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return bad("Body too large.", 413);
  if (limited(ipOf(request))) return bad("Too many grades. Try again in a minute.", 429);

  let body: { item?: unknown; grade?: unknown; anon?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return bad("Body too large.", 413);
    body = JSON.parse(text);
  } catch {
    return bad("Send JSON: {item, grade, anon}.");
  }
  const { item, grade, anon } = body;
  if (typeof item !== "string" || !entryForItem(item)) return bad("Unknown item.", 404);
  if (!isGrade(grade)) return bad("Grade must be A+ through F.");
  if (typeof anon !== "string" || !UUID.test(anon)) return bad("Missing browser id.");

  const store = gradeStore();
  if (!store) return unavailable();
  try {
    return ok(await store.upsert(item, anon.toLowerCase(), grade), "no-store");
  } catch (e) {
    console.log(`[Grades] POST ${item} failed: ${(e as Error).message}`);
    return unavailable();
  }
}
