import { dailyAnswer, dailyKeys } from "@/lib/dailyLogo";

// GET /quiz/daily/answer/<key> -> one day's answer as a tiny JSON file.
// Prebuilt for every scheduled day at build time (no function runs per
// request). The Daily Logo page fetches it only after the reader finishes, so
// the answer is not in the page itself.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return dailyKeys().map((key) => ({ key }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const answer = dailyAnswer(key);
  if (!answer) return new Response("Not found", { status: 404 });
  return Response.json(answer);
}
