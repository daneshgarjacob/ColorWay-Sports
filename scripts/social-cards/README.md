# Social cards (Facebook / LinkedIn), 1080x1350

House style for social graphics, matched to the site and the Page cover: Hanken Grotesk 800 headlines, sky (#9FB6D6) tracked eyebrow, navy radial field with faint pinstripes, brand-blue rule and grade pills, real white wordmark (public/brand/colorway-sports-logo-white.png) bottom-left.

Render: copy the HTML + base.css + images into a folder, serve it (`python3 -m http.server 8765`), open each page at 1080x1350 in a real browser (Playwright), wait for `document.fonts.ready`, screenshot. PIL can't match the typography.

- closet.html: headline + one team-provided image with a rank pill (credit the team on the image)
- numbers.html: 2x3 grid of team-colored tiles
- linkedin.html: type-only list (LinkedIn rule: no team logos or photos)
