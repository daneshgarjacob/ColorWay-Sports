#!/usr/bin/env node
// Uniform fact guard. Born from the 2026-10-09 reader correction: we said Alabama
// wears no names on the back. They have since 1981. A uniform site cannot get that wrong.
//
// Two checks:
//   1. HARD FAIL: any sentence in content/posts that contradicts a verified fact in
//      scripts/data/uniform-facts.json (today: names on the back).
//   2. REVIEW LIST: absolute uniform claims ("no names", "never wears", "only team",
//      "first time in history"...) in the posts you pass in, or in posts changed vs
//      main if you pass none. Each one must be backed by a game photo or official
//      source before it ships.
//
// Usage: node scripts/check-uniform-claims.mjs [content/posts/foo.md ...]
// Exit 1 on any hard fail.

import { readFileSync, readdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const POSTS = "content/posts";
const { facts } = JSON.parse(readFileSync("scripts/data/uniform-facts.json", "utf8"));

const NO_NAMES = /\b(no|without|never|not)\b[^.]{0,40}\b(nameplates?|names?|player names?)\b[^.]{0,25}\b(back|jerseys?)\b|\bno nameplates?\b|\bnameless\b/i;
const HAS_NAMES = /\b(names?|nameplates?)\b[^.]{0,30}\b(on|above)\b[^.]{0,20}\b(back|number)\b/i;
const RISKY = [
  /\b(no|without)\b[^.]{0,30}\b(nameplates?|names on|logo on the helmet|stripes?|alternates?)\b/i,
  /\b(never|has never|have never|does not|doesn't|do not)\b[^.]{0,30}\b(wear|worn|put|used?)\b/i,
  /\b(the only|one of the (few|only)|first time in (franchise |program |club )?history)\b/i,
  /\b(always wears?|every game|has not changed|barely changed|untouched)\b/i,
];

const sentences = (text) => text.replace(/^---[\s\S]*?---/, "").split(/(?<=[.!?])\s+|\n+/);
const lineOf = (text, s) => text.slice(0, text.indexOf(s)).split("\n").length;

let fails = 0;
for (const file of readdirSync(POSTS).filter((f) => f.endsWith(".md"))) {
  const text = readFileSync(path.join(POSTS, file), "utf8");
  for (const s of sentences(text)) {
    for (const f of facts) {
      if (!f.aliases.some((a) => s.includes(a)) || /\?\**\s*$/.test(s)) continue; // skip FAQ questions
      const saysNone = NO_NAMES.test(s);
      const saysNames = HAS_NAMES.test(s) && !saysNone;
      const wrong =
        (f.namesOnBack === true && saysNone && !/road|away/i.test(s)) ||
        (f.namesOnBack === false && saysNames);
      if (wrong) {
        fails++;
        console.log(`✗ ${POSTS}/${file}:${lineOf(text, s)}  [${f.team} namesOnBack=${f.namesOnBack}]\n    ${s.trim().slice(0, 220)}\n    fact: ${f.source}`);
      }
    }
  }
}

let targets = process.argv.slice(2);
if (!targets.length) {
  try {
    targets = execSync("git diff --name-only main -- content/posts; git ls-files --others --exclude-standard content/posts", { encoding: "utf8" })
      .split("\n").filter((f) => f.endsWith(".md"));
  } catch { targets = []; }
}
let review = 0;
for (const file of [...new Set(targets)]) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  for (const s of sentences(text)) {
    if (RISKY.some((r) => r.test(s))) {
      if (!review++) console.log("\nVerify each absolute claim against a game photo or official source:");
      console.log(`  ? ${file}:${lineOf(text, s)}  ${s.trim().slice(0, 200)}`);
    }
  }
}

console.log(fails ? `\n${fails} sentence(s) contradict verified uniform facts.` : "\nNo contradictions with verified uniform facts.");
process.exit(fails ? 1 : 0);
