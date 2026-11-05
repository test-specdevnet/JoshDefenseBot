import pages from "../knowledge/pages.json" with { type: "json" };
export { pages };
const stop = new Set(
  "the a an is are what how to of in and me it about does tell can you gd general dynamics company canada canadian".split(
    " ",
  ),
);
export function retrieve(query: string) {
  let q = query.toLowerCase();
  if (/biggest|largest|main.*client|customer/.test(q))
    q += " customer concentration revenue government";
  if (/popular|best.sell|flagship/.test(q))
    q += " product sonobuoy meshnet sales rank";
  const terms = [...new Set(q.match(/[\p{L}\p{N}-]+/gu) ?? [])].filter(
    (t) => !stop.has(t),
  );
  return pages
    .map((page) => {
      const title = page.title.toLowerCase(),
        tokens = new Set(
          page.text.toLowerCase().match(/[\p{L}\p{N}-]+/gu) ?? [],
        );
      return {
        ...page,
        score: terms.reduce(
          (n, t) => n + (title.includes(t) ? 3 : tokens.has(t) ? 1 : 0),
          0,
        ),
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((p) => p.score > 0)
    .slice(0, 6);
}
