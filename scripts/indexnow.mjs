// Tell Bing (and the other IndexNow engines) about new or updated URLs, without
// Bing Webmaster Tools. The key file public/11469d9f294ed02332b432e29f1f408f.txt proves we own the site.
//
//   node scripts/indexnow.mjs /stories/some-slug /stories/another-slug
//
// Paths or full URLs both work. 200/202 = accepted.
const KEY = "11469d9f294ed02332b432e29f1f408f";
const HOST = "www.colorwaysports.com";
const urls = process.argv.slice(2).map((u) => (u.startsWith("http") ? u : `https://${HOST}${u.startsWith("/") ? "" : "/"}${u}`));
if (!urls.length) {
  console.error("usage: node scripts/indexnow.mjs <path-or-url> [...]");
  process.exit(1);
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(res.status, res.statusText, `(${urls.length} URL${urls.length === 1 ? "" : "s"})`);
if (res.status >= 300) console.log(await res.text());
