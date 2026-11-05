# Josh Defense Bot

A camouflage-inspired educational chat app featuring the supplied Josh mascot. Cloudflare Worker serves static assets and a conversational Workers AI backend. Chat, quiz and recap modes use conversation context and retrieved official-site evidence. Source links accompany responses. No API keys ship to the browser.

## Run

Node 24+, `npm ci`, `npm run dev`. Workers AI needs Cloudflare authentication and remote inference. `npm run check`, `npm test`, `npm audit --audit-level=high`, `npx wrangler deploy --dry-run`, then `npm run deploy`. Account is configured in wrangler.jsonc. AI usage may incur Cloudflare charges.

## Knowledge and limits

Exclusive factual source: https://gdmissionsystems.ca/. **This release has four manually summarized source records verified through the search index on November 5, 2026. It has NOT absorbed the whole website.** Direct requests were blocked by Azure WAF. Product directory pagination, news archives, PDFs, media and specifications remain unindexed. The coverage endpoint and UI disclose this. No claim of exhaustive expertise is warranted.

`knowledge/pages.json` contains factual summaries and provenance. `knowledge/urls.json` is an initial manifest, not a complete sitemap. `npm run import` checks robots policy and downloads accessible HTML main text into ignored work files for review. It stops on inaccessible policies and does not bypass access controls. Expand the manifest from an authorized sitemap/export, extract PDFs separately, summarize and review evidence, then update pages.json, test retrieval and redeploy. Full-site ingestion and automatic refresh are future work; no scheduled job is currently configured. Retrieval is lexical and intentionally simple; a larger corpus should use chunked semantic retrieval.

## Privacy and protection

Chat exists only in tab memory and is sent to Cloudflare Workers AI for inference. This app does not persist chat transcripts. Cloudflare platform metadata may be logged; application errors log only error type. Same-origin POST checks, bounded messages, per-IP rate limits, plain-text rendering and restrictive asset headers protect the chat surface. Public access has no account system; rate limiting is not a global spending cap. Configure account budgets and access policy for larger launches.

This is an independent learning tool, not an official General Dynamics service. Generated responses may be incorrect; verify cited sources. The user supplied the mascot artwork. GD trademarks and linked content remain with their owners.

## Repository layout

`public/` interface and mascot; `src/` Worker and retrieval; `knowledge/` evidence and URL manifest; `scripts/` import workflow; `tests/` retrieval checks; `.github/workflows/` audit CI. Wrangler configuration is the deployment source of truth.
