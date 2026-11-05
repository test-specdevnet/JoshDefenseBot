import pages from "../knowledge/pages.json" with { type: "json" };
export { pages };
const stop = new Set(
  "the a an is are what how to of in and me it about does tell can you".split(
    " ",
  ),
);
export function retrieve(query: string) {
  const terms = [
    ...new Set(query.toLowerCase().match(/[\p{L}\p{N}-]+/gu) ?? []),
  ].filter((t) => !stop.has(t));
  return pages
    .map((page) => {
      const text = `${page.title} ${page.text}`.toLowerCase();
      return {
        ...page,
        score: terms.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((p) => p.score > 0)
    .slice(0, 5);
}
