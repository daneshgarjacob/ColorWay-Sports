// The article page is a centered grid: a 720px text column plus the 300px
// "Keep Reading" rail from lg up. Anything stacked above the article (the
// title hero, the wear boxes, quick links) has to sit in the SAME grid, or it
// centers on the page and floats to the right of the text below it.
export const ARTICLE_ROW =
  "mx-auto max-w-[1120px] px-5 lg:grid lg:grid-cols-[minmax(0,720px)_300px] lg:justify-center lg:gap-10";
export const ARTICLE_COL = "min-w-0 max-w-[720px] mx-auto lg:mx-0";
