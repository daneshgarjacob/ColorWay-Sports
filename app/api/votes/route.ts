import { NextResponse, type NextRequest } from "next/server";
import { isChoice, isClosed, isMulti, isOptionOf, pollFor, type OptionTally, type Poll, type VoteTally } from "@/lib/votes/polls";
import { voteStore, type Counts, type OptionCounts } from "@/lib/votes/store";

// Fan vote API (components/BracketVote.tsx, components/FavoriteVote.tsx), modeled on app/api/grades.
//
//   GET  /api/votes?item=tg26:r1-m1        -> the tally, CDN-cached a minute
//   POST /api/votes {item, choice, anon}    -> record this browser's vote (first wins), return the tally
//
// Head-to-head polls take choice "A" or "B" and answer {item, count, a, b, closed}.
// Pick-one-of-many polls (lib/votes/polls.ts `options`) take an option key as
// the choice and answer {item, count, counts: {key: n}, closed}.
//
// Readers who never tap never hit this route. No store configured in
// production = 503 and the control fails soft (see lib/votes/store.ts).

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 512;
const BOT_UA = /bot|crawl|spider|slurp|fetch|headless|curl|wget|python|preview/i;

// Per-IP rate limit, in memory (per serverless instance; blunts a loop, not a
// security boundary). A reader casts at most a handful, so 20 a minute is plenty.
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

// Two kinds of 503, which the vote box words differently: "unavailable" = no
// store is configured (the pick stays on the reader's device), "failed" = the
// store errored (the reader is told the vote did not save and can retry).
const unavailable = () =>
  NextResponse.json(
    { error: "Site votes are not available yet.", code: "unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );

const failed = () =>
  NextResponse.json(
    { error: "Could not save the vote. Try again.", code: "failed" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );

const tally = (poll: Poll, c: Counts): VoteTally => ({ item: poll.id, count: c.a + c.b, a: c.a, b: c.b, closed: isClosed(poll) });

// Every option key is present (0 when it has no votes); stray keys are never counted.
const optionTally = (poll: Poll, c: OptionCounts): OptionTally => {
  const counts: Record<string, number> = {};
  for (const o of poll.options ?? []) counts[o.key] = c[o.key] ?? 0;
  return { item: poll.id, count: Object.values(counts).reduce((s, n) => s + n, 0), counts, closed: isClosed(poll) };
};

const ok = (t: VoteTally | OptionTally, cache: string) => NextResponse.json(t, { headers: { "Cache-Control": cache } });

export async function GET(request: NextRequest) {
  const poll = pollFor(request.nextUrl.searchParams.get("item"));
  if (!poll) return bad("Unknown item.", 404);
  const store = voteStore();
  if (!store) return unavailable();
  try {
    const cache = "public, s-maxage=60, stale-while-revalidate=300";
    if (isMulti(poll)) return ok(optionTally(poll, await store.getOptions(poll.id)), cache);
    return ok(tally(poll, await store.get(poll.id)), cache);
  } catch (e) {
    console.log(`[Votes] GET ${poll.id} failed: ${(e as Error).message}`);
    return failed();
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
  const multi = isMulti(poll);
  if (multi ? !isOptionOf(poll, body.choice) : !isChoice(body.choice)) {
    return bad(multi ? "Unknown choice." : "Choice must be A or B.");
  }
  if (typeof body.anon !== "string" || !UUID.test(body.anon)) return bad("Missing browser id.");

  const store = voteStore();
  if (!store) return unavailable();
  try {
    if (multi) {
      const anon = body.anon.toLowerCase();
      const key = body.choice as string;
      if (isClosed(poll)) return ok(optionTally(poll, await store.getOptions(poll.id)), "no-store");
      return ok(optionTally(poll, await store.castOption(poll.id, anon, key)), "no-store");
    }
    if (!isChoice(body.choice)) return bad("Choice must be A or B.");
    if (isClosed(poll)) return ok(tally(poll, await store.get(poll.id)), "no-store");
    return ok(tally(poll, await store.cast(poll.id, body.anon.toLowerCase(), body.choice)), "no-store");
  } catch (e) {
    console.log(`[Votes] POST ${poll.id} failed: ${(e as Error).message}`);
    return failed();
  }
}
