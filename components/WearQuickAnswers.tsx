import type { WearAnswer } from "@/lib/teamWearAnswers";

/** The visible half of the live boxes' FAQ schema: each question, answered. */
export default function WearQuickAnswers({ answers }: { answers: WearAnswer[] }) {
  if (answers.length === 0) return null;
  return (
    <dl className="mt-5 pt-4 border-t border-black/10 space-y-3">
      {answers.map(({ q, a }) => (
        <div key={q}>
          <dt className="text-[13px] font-extrabold text-[#0B1F4A] leading-snug">{q}</dt>
          <dd className="mt-0.5 text-[13px] text-black/70 leading-relaxed">{a}</dd>
        </div>
      ))}
    </dl>
  );
}
