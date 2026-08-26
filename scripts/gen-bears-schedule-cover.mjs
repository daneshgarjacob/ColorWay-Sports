// Bears schedule-post cover, rebuilt full bleed.
//
// The old one letterboxed the portrait Rivalries poster inside a 3:2 frame, which
// left a dead orange bar down each side on the homepage card. This fills the frame
// from the higher-resolution poster already in the post folder and crops from the
// top, so the "RETURN OF THE MONSTERS" lockup and both players' faces survive.
//
// Usage: node scripts/gen-bears-schedule-cover.mjs [topOffset]
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "public/images/posts/bears-uniform-schedule-2026");
const SRC = resolve(dir, "rivalries-monsters-group.jpg"); // 1080x1350, the full poster
const OUT = resolve(dir, "cover.jpg");

const W = 1500, H = 1000; // 3:2, the house cover spec

// Scale the poster to the full cover width, then take a window of it. Anchored
// near the top rather than centred: the headline and the standing player's face
// are both in the upper half, and a centred crop loses the lockup entirely.
const TOP = Number(process.argv[2] ?? 40);

const scaled = await sharp(SRC).resize({ width: W }).toBuffer();
const meta = await sharp(scaled).metadata();
const top = Math.max(0, Math.min(TOP, (meta.height ?? H) - H));

await sharp(scaled)
  .extract({ left: 0, top, width: W, height: H })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);

console.log(`wrote ${OUT} from a ${meta.width}x${meta.height} scale, window top=${top}`);
