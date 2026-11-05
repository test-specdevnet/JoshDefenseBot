import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fallbackPlan,
  normalizeResults,
  systemPrompt,
  research,
} from "../src/conversation.ts";
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
test("research results reject unsafe source links", () =>
  assert.equal(
    normalizeResults({
      items: [{ url: "javascript:alert(1)", title: "x", description: "x" }],
    }).length,
    0,
  ));
test("social research makes no external requests", async () => {
  const r = await research(
    {
      websearch: () => {
        throw Error("must not call");
      },
    } as never,
    { intent: "social", query: "hi", current: false, expression: "wave" },
  );
  assert.equal(r.status, "not-needed");
});
test("failed search is reported rather than invented", async () => {
  const r = await research(
    { websearch: async () => new Response("", { status: 403 }) } as never,
    {
      intent: "research",
      query: "GD",
      current: true,
      expression: "thoughtful",
    },
  );
  assert.equal(r.status, "unavailable");
  assert.equal(r.sources.length, 0);
});
test("analysis instructions separate scenarios and scope", () => {
  const s = systemPrompt(
    {
      intent: "analysis",
      query: "GD",
      expression: "thoughtful",
      current: true,
    },
    [],
    "unavailable",
  );
  assert.match(s, /GD Corporation/);
  assert.match(s, /NOT publication dates/);
  assert.match(s, /guaranteed forecasts/);
  assert.match(s, /unavailable/);
});
