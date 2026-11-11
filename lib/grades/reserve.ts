// Space reservation for Grade It (components/GradeIt.tsx) for readers who
// already graded the item.
//
// Their grade lives in localStorage, so the results panel (three rings, the
// fan chart, Share) can only open after hydration, and opening it then pushed
// the rest of the Jersey of the Day card down: a layout shift on every return
// visit. gradeItReserveScript() is a tiny inline script the page renders right
// after <GradeIt>; it runs while the HTML is still parsing, before first paint,
// and if this browser has graded the item it marks the section data-graded so
// globals.css (.gi-box[data-graded]) reserves the opened panel's height.
// Plain module (not "use client") so server components can call it.

export const GRADES_KEY = "cw-grades-v1"; // { [item]: Grade }

export const gradeItSectionId = (item: string) => `grade-it-${item.replace(/[^a-z0-9-]/gi, "-")}`;

export function gradeItReserveScript(item: string): string {
  return `try{var g=JSON.parse(localStorage.getItem(${JSON.stringify(GRADES_KEY)})||"{}");if(g[${JSON.stringify(item)}]){var e=document.getElementById(${JSON.stringify(gradeItSectionId(item))});if(e)e.setAttribute("data-graded","")}}catch(e){}`;
}
