import { NextResponse, type NextRequest } from "next/server";
import { isChoice, isClosed, pollFor, type Poll, type VoteTally } from "@/lib/votes/polls";
import { voteStore, type Counts } from "@/lib/votes/store";

// Fan vote API (components/BracketVote.tsx), modeled on app/api/grades.
//
//   GET  /api/votes?item=tg26:r1-m1        -> the tally, CDN-cached a minute
//   POST /api/votes {item, choice, anon}    -> record this browser's vote (first wins), return the tally
//
// Readers who never tap never hit this route. No store configured in
// production = 503 and the control fails soft (see lib/votes/store.ts).

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 512;
const BOT_UA = /bot|crawl|spider|slurp|fetch|headless|curl|wget|python|preview/i;

// Per-IP rate limit, in memory (per serverless instance; blunts a loop, not a
// security boundary). Four matchups a round, so 20 a minute is plenty.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
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
  NextResponse.json({ error: "Site votes are not available yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });

const tally = (poll: Poll, c: Counts): VoteTally => ({ item: poll.id, count: c.a + c.b, a: c.a, b: c.b, closed: isClosed(poll) });

const ok = (t: VoteTally, cache: string) => NextResponse.json(t, { headers: { "Cache-Control": cache } });

export async function GET(request: NextRequest) {
  const poll = pollFor(request.nextUrl.searchParams.get("item"));
  if (!poll) return bad("Unknown item.", 404);
  const store = voteStore();
  if (!store) return unavailable();
  try {
    return ok(tally(poll, await store.get(poll.id)), "public, s-maxage=60, stale-while-revalidate=300");
  } catch (e) {
    console.log(`[Votes] GET ${poll.id} failed: ${(e as Error).message}`);
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  if (BOT_UA.test(request.headers.get("user-agent") ?? "") || !request.headers.get("user-agent")) {
    return bad("Not accepted.", 403);
  }
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return bad("Body too large.", 413);
  if (limited(ipOf(request))) return bad("Too many votes. Try again in a minute.", 429);

  let body: { item?: unknown; choice?: unknown; anon?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return bad("Body too large.", 413);
    body = JSON.parse(text);
  } catch {
    return bad("Send JSON: {item, choice, anon}.");
  }
  const poll = pollFor(body.item);
  if (!poll) return bad("Unknown item.", 404);
  if (!isChoice(body.choice)) return bad("Choice must be A or B.");
  if (typeof body.anon !== "string" || !UUID.test(body.anon)) return bad("Missing browser id.");

  const store = voteStore();
  if (!store) return unavailable();
  try {
    if (isClosed(poll)) return ok(tally(poll, await store.get(poll.id)), "no-store");
    return ok(tally(poll, await store.cast(poll.id, body.anon.toLowerCase(), body.choice)), "no-store");
  } catch (e) {
    console.log(`[Votes] POST ${poll.id} failed: ${(e as Error).message}`);
    return unavailable();
  }
}
