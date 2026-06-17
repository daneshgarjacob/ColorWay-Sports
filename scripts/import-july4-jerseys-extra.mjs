#!/usr/bin/env node
// Import the two late-added Fourth of July jerseys: White Sox + Rangers.
import sharp from "sharp";
import { readdir } from "fs/promises";
import { resolve } from "path";

const SRC = "/Users/jakedaneshgar/Desktop/4th-july-jerseys";
const OUT = resolve("public/images/posts/mlb-july-4th-jerseys-2026");
const files = await readdir(SRC);

async function conv(file, slug) {
  await sharp(resolve(SRC, file))
    .resize(760, 760, { fit: "inside" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82 })
    .toFile(resolve(OUT, slug + ".jpg"));
  console.log("  ok", slug, "<-", file.slice(0, 44));
}

const ws = files.find((f) => f.includes("white-sox"));
if (ws) await conv(ws, "white-sox"); else console.log("  MISSING white-sox source");
const tex = files.find((f) => f === "HK3UnwxXoAAqy6v.jpg");
if (tex) await conv(tex, "rangers"); else console.log("  MISSING rangers source");
