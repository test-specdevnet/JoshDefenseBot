import { test } from "node:test";
import assert from "node:assert/strict";
import { retrieve, pages } from "../src/retrieval.ts";
test("product questions retrieve the directory", () =>
  assert.equal(
    retrieve("MESHnet TMR-304")[0].title,
    "Public product directory",
  ));
test("unsupported claims have no retrieved evidence", () =>
  assert.equal(retrieve("unobtainium secret missile blueprints").length, 0));
test("every source uses the exclusive official origin and carries provenance", () => {
  for (const page of pages) {
    assert.equal(new URL(page.url).origin, "https://gdmissionsystems.ca");
    assert.ok(page.verified);
    assert.ok(page.method);
  }
});
