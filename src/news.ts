import { load } from "cheerio/slim";
export type NewsEvidence = {
  title: string;
  url: string;
  text: string;
  verified: string;
  method: string;
};
const https = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
export function parseNews(xml: string, now = new Date()): NewsEvidence[] {
  const $ = load(xml, { xmlMode: true });
  return $("item")
    .toArray()
    .slice(0, 15)
    .flatMap((item) => {
      const node = $(item),
        title = node.find("title").first().text().trim(),
        url = node.find("link").first().text().trim();
      const publisher = node.find("source").first().text().trim();
      const published = new Date(node.find("pubDate").first().text());
      if (
        !title ||
        !https(url) ||
        !Number.isFinite(published.getTime()) ||
        published.getTime() > now.getTime() + 86400000
      )
        return [];
      const description = load(node.find("description").first().text())
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1000);
      return [
        {
          title,
          url,
          text: `Publisher: ${publisher || "Not specified"}. Published: ${published.toISOString()}. Indexed headline: ${title}. Feed excerpt: ${description}. This is discovery metadata, not a verified full article.`,
          verified: now.toISOString(),
          method:
            "Live Google News RSS index; publisher/date supplied by feed; full article not read",
        },
      ];
    });
}
async function bounded(response: Response) {
  if (!response.ok) throw Error(`Feed HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw Error("Empty feed");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 1500000) {
      await reader.cancel();
      throw Error("Feed too large");
    }
    chunks.push(part.value);
  }
  const data = new Uint8Array(size);
  let i = 0;
  for (const c of chunks) {
    data.set(c, i);
    i += c.length;
  }
  return new TextDecoder().decode(data);
}
export async function searchNews(query: string, fetcher: typeof fetch = fetch) {
  const params = new URLSearchParams({
    q: query.slice(0, 600),
    hl: "en-CA",
    gl: "CA",
    ceid: "CA:en",
  });
  const response = await fetcher(
    `https://news.google.com/rss/search?${params}`,
    {
      headers: { Accept: "application/rss+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(8500),
      redirect: "manual",
      cf: { cacheTtl: 600, cacheEverything: true },
    },
  );
  const xml = await bounded(response);
  if (!/<rss[\s>]/i.test(xml)) throw Error("Invalid news feed");
  return parseNews(xml);
}
export async function searchGdelt(
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<NewsEvidence[]> {
  const params = new URLSearchParams({
    query: query.replace(/[^\p{L}\p{N}\s-]/gu, " ").slice(0, 240),
    mode: "ArtList",
    format: "json",
    maxrecords: "8",
    sort: "DateDesc",
    timespan: "1month",
  });
  const response = await fetcher(
    `https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
    {
      signal: AbortSignal.timeout(8500),
      redirect: "manual",
      cf: { cacheTtl: 600, cacheEverything: true },
    },
  );
  const data = JSON.parse(await bounded(response));
  if (!Array.isArray(data.articles)) return [];
  return data.articles.slice(0, 8).flatMap((p: Record<string, unknown>) => {
    if (
      typeof p.url !== "string" ||
      !https(p.url) ||
      typeof p.title !== "string"
    )
      return [];
    return [
      {
        title: p.title.slice(0, 240),
        url: p.url,
        text: `Indexed headline: ${p.title}. Publisher: ${typeof p.domain === "string" ? p.domain : "unknown"}. Index seen date: ${typeof p.seendate === "string" ? p.seendate : "unknown"}. Discovery metadata only; full article not read.`,
        verified: new Date().toISOString(),
        method:
          "Live GDELT news index; seen date is not necessarily publication date",
      },
    ];
  });
}
