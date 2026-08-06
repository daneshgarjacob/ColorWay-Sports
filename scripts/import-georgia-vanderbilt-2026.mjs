// Imports the Georgia all-white and Vanderbilt old gold uniform reveal images
// (school-issued reveal photography, dropped on the Desktop) into the two post
// folders. Full-frame images are resized only — never cropped, so the uniform is
// always shown whole. The two 3:2 covers are centre-cropped for the StoryCard.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Originals were archived off the Desktop after import; re-run against the archive.
const D = '/Users/jakedaneshgar/Pictures/ColorWay-Jersey-Sources/2026-08-06-cfb/';
const OUT = fileURLToPath(new URL('../public/images/posts/', import.meta.url));

const full = [
  ['HO-Zg2xWUAAMLQG.jpg', 'georgia-all-white-2026/georgia-all-white-unleashed.jpg'],
  ['HO-kPMpW0AAMKwV.jpg', 'georgia-all-white-2026/georgia-all-white-helmet.jpg'],
  ['HO-kPNPWMAAB3bh.jpg', 'georgia-all-white-2026/georgia-all-white-details.jpg'],
  ['HO-kPM4XAAAue0Y.jpg', 'georgia-all-white-2026/georgia-all-white-two-views.jpg'],
  ['HPAKeSuXoAAoSNR.jpg', 'vanderbilt-gold-2026/vanderbilt-gold-full.jpg'],
  ['HPCrN_oXEAAhcPn.jpg', 'vanderbilt-gold-2026/vanderbilt-gold-shoulder.jpg'],
  ['HPCrN_qWsAAVMfm.jpg', 'vanderbilt-gold-2026/vanderbilt-gold-patch.jpg'],
  ['HPCrN_rXsAAnKYd.jpg', 'vanderbilt-gold-2026/vanderbilt-gold-pants.jpg'],
  ['HPCrN_qWcAAGHTA.jpg', 'vanderbilt-gold-2026/vanderbilt-gold-numbers.jpg'],
];

// Covers are 3:2 / 1500x1000 to match StoryCard's aspect-[3/2] object-cover.
// Georgia's reveal graphic is 16:9 and survives a centre crop with the player and
// the "UNLEASHED" wordmark intact.
const covers = [
  ['HO-Zg2xWUAAMLQG.jpg', 'georgia-all-white-2026/georgia-all-white-cover.jpg'],
];

for (const [src, dst] of full) {
  await sharp(D + src)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(OUT + dst);
  console.log('full  ', dst);
}

for (const [src, dst] of covers) {
  await sharp(D + src)
    .resize(1500, 1000, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(OUT + dst);
  console.log('cover ', dst);
}

// Vanderbilt's only full-uniform shot is a 4:5 portrait, and centre-cropping it to
// 3:2 would chop the uniform in half. Its studio backdrop is effectively black, so
// instead of cropping we extend that backdrop out to 3:2 and sit the whole figure
// in the middle — the seam is invisible and the uniform stays intact.
await sharp({
  create: { width: 1500, height: 1000, channels: 3, background: { r: 6, g: 6, b: 6 } },
})
  .composite([
    {
      input: await sharp(D + 'HPAKeSuXoAAoSNR.jpg')
        .resize({ height: 1000, fit: 'inside', withoutEnlargement: false })
        .toBuffer(),
      gravity: 'centre',
    },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT + 'vanderbilt-gold-2026/vanderbilt-gold-cover.jpg');
console.log('cover  vanderbilt-gold-2026/vanderbilt-gold-cover.jpg (backdrop extended, uniform uncropped)');
