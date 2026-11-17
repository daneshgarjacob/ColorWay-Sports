"use client";

import { useSearchParams } from "next/navigation";

// Same formsubmit.co endpoint as /contact. The _subject lets Jake filter these
// in Gmail; _next brings the reader back here with a thank-you note.

const FIELD =
  "w-full border border-black/15 rounded-lg px-4 py-3.5 text-[17px] bg-white focus:outline-none focus:border-[#0025CC] focus:ring-2 focus:ring-[#0025CC]/15 transition-colors";
const LABEL = "block text-[16px] font-bold text-black mb-1.5";
const HINT = "font-normal text-[#5b6474]";

export default function AskForm() {
  const sent = useSearchParams().get("sent") === "true";

  return (
    <>
      {sent && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-5 mb-8 text-center">
          <p className="text-green-800 font-semibold text-[17px]">
            Got it, thanks! If we pick your question, it becomes a story on the site.
          </p>
        </div>
      )}

      <form action="https://formsubmit.co/jake@colorwaysports.com" method="POST" className="space-y-6">
        {/* Honeypot spam prevention */}
        <input type="text" name="_honey" style={{ display: "none" }} />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_next" value="https://www.colorwaysports.com/ask?sent=true" />
        <input type="hidden" name="_subject" value="Ask ColorWay question" />

        <div>
          <label htmlFor="ask-question" className={LABEL}>
            Your Question
          </label>
          <textarea
            id="ask-question"
            name="question"
            rows={4}
            required
            placeholder="Why do the Bears wear GSH on their sleeves?"
            className={`${FIELD} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="ask-team" className={LABEL}>
            Team <span className={HINT}>(optional)</span>
          </label>
          <input id="ask-team" type="text" name="team" placeholder="Chicago Bears" className={FIELD} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ask-name" className={LABEL}>
              First Name <span className={HINT}>(optional)</span>
            </label>
            <input id="ask-name" type="text" name="first_name" autoComplete="given-name" className={FIELD} />
            <p className="mt-1.5 text-[15px] text-[#5b6474]">For credit if we answer it.</p>
          </div>
          <div>
            <label htmlFor="ask-email" className={LABEL}>
              Email <span className={HINT}>(optional)</span>
            </label>
            <input id="ask-email" type="email" name="email" autoComplete="email" className={FIELD} />
            <p className="mt-1.5 text-[15px] text-[#5b6474]">If you want to know when we answer.</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-[#0025CC] hover:bg-[#001ea6] text-white font-bold text-[17px] px-10 py-3.5 rounded-lg transition-colors"
        >
          Send My Question
        </button>
      </form>
    </>
  );
}
