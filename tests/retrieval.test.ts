import { test } from "node:test";
import assert from "node:assert/strict";
import { retrieve, pages } from "../src/retrieval.ts";
test("product questions retrieve the directory", () =>
  assert.equal(
    retrieve("MESHnet TMR-304")[0].title,
    "Public product directory",
  ));
test("unknown queries do not return arbitrary records", () =>
  assert.equal(retrieve("unobtainium secret missile blueprints").length, 0));
test("largest client question finds revenue concentration", () =>
  assert.ok(
    retrieve("What is the biggest client of GD?").some((p) =>
      p.title.includes("customer concentration"),
    ),
  ));
test("sources have official provenance", () => {
  for (const p of pages) {
    assert.ok(
      [
        "gdmissionsystems.ca",
        "www.gd.com",
        "investorrelations.gd.com",
      ].includes(new URL(p.url).hostname),
    );
    assert.ok(p.verified);
    assert.ok(p.method);
  }
});
