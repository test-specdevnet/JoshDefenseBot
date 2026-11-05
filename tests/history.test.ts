import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readArchive,
  writeArchive,
  conversationContext,
  STORAGE_KEY,
} from "../public/history.js";
function storage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}
test("separate conversations survive a browser storage round trip", () => {
  const s = storage(),
    a = {
      version: 1,
      active: "a",
      chats: [
        {
          id: "a",
          title: "Canada",
          messages: [
            { role: "user", content: "My name is Alex" },
            {
              role: "assistant",
              content: "Hello Alex",
              sources: [
                {
                  title: "Official",
                  url: "https://gdmissionsystems.ca/about-us",
                },
              ],
            },
          ],
        },
        {
          id: "b",
          title: "New chat",
          messages: [{ role: "user", content: "Hi Josh" }],
        },
      ],
    };
  writeArchive(s, a);
  const loaded = readArchive(s);
  assert.equal(loaded.active, "a");
  assert.equal(
    loaded.chats[0].messages[1].sources[0].url,
    "https://gdmissionsystems.ca/about-us",
  );
  assert.equal(loaded.chats[1].messages.length, 1);
  assert.ok(!JSON.stringify(loaded.chats[1]).includes("Alex"));
});
test("corrupt history is reported without overwriting browser data", () => {
  const s = storage();
  s.setItem(STORAGE_KEY, "broken");
  assert.throws(() => readArchive(s));
  assert.equal(s.getItem(STORAGE_KEY), "broken");
});
test("stored unsafe citation links cannot be restored", () => {
  const s = storage();
  writeArchive(s, {
    version: 1,
    active: "a",
    chats: [
      {
        id: "a",
        title: "x",
        messages: [
          {
            role: "assistant",
            content: "x",
            sources: [{ url: "javascript:alert(1)", title: "x" }],
          },
        ],
      },
    ],
  });
  assert.equal(readArchive(s).chats[0].messages[0].sources.length, 0);
});
test("conversation context recalls early messages and strips UI metadata", () => {
  const messages = [
    { role: "user", content: "Remember that my focus is sonar" },
    { role: "assistant", content: "Got it", sources: [] },
    { role: "user", content: "What is my focus?" },
  ];
  const context = conversationContext(messages);
  assert.equal(context[0].content, "Remember that my focus is sonar");
  assert.ok(context.every((m) => !("sources" in m)));
});
test("context remains bounded on very long local history", () => {
  const m = Array.from({ length: 60 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: "x".repeat(3000),
  }));
  const c = conversationContext(m);
  assert.ok(c.reduce((n, m) => n + m.content.length, 0) <= 48000);
  assert.equal(c[0].role, "user");
});
