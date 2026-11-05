import { load } from "cheerio";
import { readFile, writeFile, mkdir } from "node:fs/promises";
// Explicit URL manifest avoids following arbitrary links or leaving the approved domain.
const urls = JSON.parse(
  await readFile(new URL("../knowledge/urls.json", import.meta.url)),
);
const pages = JSON.parse(
  await readFile(new URL("../knowledge/pages.json", import.meta.url)),
);
await mkdir("work", { recursive: true });
const report = {
  at: new Date().toISOString(),
  imported: [],
  failed: [],
  complete: false,
};
const robots = await fetch("https://gdmissionsystems.ca/robots.txt");
if (!robots.ok)
  throw new Error(
    `Robots policy inaccessible (${robots.status}); import stopped. Existing knowledge preserved.`,
  );
const policy = await robots.text();
// Conservative: stop if any disallow directive applies; review the policy before narrowing scope.
if (/Disallow:\s*\S/i.test(policy) || !/user-agent:/i.test(policy))
  throw new Error(
    "Review robots policy before importing. Existing knowledge preserved.",
  );
for (const url of urls) {
  try {
    if (new URL(url).origin !== "https://gdmissionsystems.ca")
      throw new Error("Outside approved source");
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.includes("text/html"))
      throw new Error(
        "Unsupported format: PDF/media requires separate extraction",
      );
    const html = await response.text();
    if (html.length > 2000000) throw new Error("Document too large");
    const $ = load(html);
    $("script,style,nav,footer,header").remove();
    const text = $("main").text().replace(/\s+/g, " ").trim();
    if (text.length < 100 || /enable javascript|azure waf/i.test(text))
      throw new Error("No accessible main content");
    // Keep downloaded full text local; review and summarize before publishing knowledge.
    await writeFile(`work/source-${report.imported.length}.txt`, text);
    report.imported.push({
      url,
      title: $("title").text(),
      characters: text.length,
    });
  } catch (e) {
    report.failed.push({ url, error: e.message });
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
await writeFile("work/import-report.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    imported: report.imported.length,
    failed: report.failed.length,
    existingKnowledge: pages.length,
    review:
      "Review local source text, summarize factual evidence into knowledge/pages.json, and rerun tests before deployment.",
  }),
);
if (report.failed.length) process.exitCode = 1;
