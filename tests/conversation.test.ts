import { test } from "node:test";
import assert from "node:assert/strict";
import { fallbackPlan, research } from "../src/conversation.ts";
import { parseNews, searchNews } from "../src/news.ts";
const xml = `<rss><channel><item><title>GD Canadian announcement</title><link>https://news.google.com/rss/articles/example</link><pubDate>Thu, 05 Nov 2026 09:00:00 GMT</pubDate><source url="https://example.com">Publisher</source><description>&lt;b&gt;Headline&lt;/b&gt;</description></item><item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Thu, 05 Nov 2026 09:00:00 GMT</pubDate></item></channel></rss>`;
test("small talk avoids research", () =>
  assert.equal(
    fallbackPlan([{ role: "user", content: "hello Josh" }]).intent,
    "social",
  ));
test("market hypotheticals require current analysis", () => {
  const p = fallbackPlan([
    {
      role: "user",
      content: "What if NATO budgets rise, how could markets react?",
    },
  ]);
  assert.equal(p.intent, "analysis");
  assert.equal(p.current, true);
});
test("RSS retains publisher and date and rejects unsafe links", () => {
  const r = parseNews(xml, new Date("2026-11-05T18:00:00Z"));
  assert.equal(r.length, 1);
  assert.match(r[0].text, /Publisher/);
  assert.match(r[0].text, /2026-11-05T09:00/);
  assert.match(r[0].method, /full article not read/);
});
test("future dated feed records are rejected", () =>
  assert.equal(parseNews(xml, new Date("2026-10-01")).length, 0));
test("social chat makes no news requests", async () => {
  const r = await research(
    { intent: "social", query: "hi", current: false, expression: "wave" },
    (() => {
      throw Error("must not call");
    }) as typeof fetch,
  );
  assert.equal(r.status, "not-needed");
});
test("live RSS succeeds without any gateway or token", async () => {
  const urls: string[] = [];
  const r = await research(
    {
      intent: "research",
      query: "General Dynamics Canada",
      current: true,
      expression: "thoughtful",
    },
    (async (url) => {
      urls.push(String(url));
      return new Response(xml);
    }) as typeof fetch,
  );
  assert.equal(r.status, "live");
  assert.equal(r.sources.length, 1);
  assert.ok(
    urls.every((u) => u.startsWith("https://news.google.com/rss/search?")),
  );
});
test("GDELT fallback activates when RSS is unavailable", async () => {
  const r = await research(
    {
      intent: "research",
      query: "General Dynamics",
      current: true,
      expression: "thoughtful",
    },
    (async (url) =>
      String(url).includes("gdeltproject.org")
        ? Response.json({
            articles: [
              {
                title: "News",
                url: "https://example.com/story",
                domain: "example.com",
                seendate: "20261105T090000Z",
              },
            ],
          })
        : new Response("", { status: 503 })) as typeof fetch,
  );
  assert.equal(r.status, "live");
  assert.equal(r.provider, "gdelt");
});
test("all upstream failures are explicit", async () => {
  const r = await research(
    {
      intent: "research",
      query: "GD",
      current: true,
      expression: "thoughtful",
    },
    (async () => new Response("", { status: 503 })) as typeof fetch,
  );
  assert.equal(r.status, "unavailable");
  assert.equal(r.sources.length, 0);
});
test("challenge HTML is never treated as evidence", async () => {
  await assert.rejects(
    searchNews(
      "GD",
      (async () => new Response("<html>Challenge</html>")) as typeof fetch,
    ),
    /Invalid news feed/,
  );
});
