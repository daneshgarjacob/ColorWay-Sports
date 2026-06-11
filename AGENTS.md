<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Images cost money — run the diet

The site serves files from `public/` raw (no next/image), so every megabyte ships to every reader and burns Vercel Fast Data Transfer. After adding ANY image, run `node scripts/compress-images.mjs` before committing. It is idempotent: recompresses rasters over 200 KB (caps longest side at 1600px), converts opaque PNGs to JPG and rewrites all references, then integrity-checks every referenced image path. Finished images should be ≤ ~300 KB. Never commit a multi-MB original. (Originals remain recoverable from git history. Context: the 2026-06-11 blowout — 1 GB of raw images drove 173 GB/30d of transfer and blew the free tier.)
