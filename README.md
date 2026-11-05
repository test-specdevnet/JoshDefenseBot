# Josh Defense Bot

A simple chat window with an expressive Josh companion. Cloudflare serves the interface and AI backend. The conversation planner resolves follow-ups and selects social, research or analysis behavior before answering. The character has eight visual expression frames plus nod/breathing motion, faster natural blinks, greeting waves, curious typing reactions, thinking gestures and concerned reactions.

## Run and verify

Node 24+, `npm ci`, `npm run dev`. Cloudflare authentication is needed for remote AI. Run `npm run check`, `npm test`, `npm audit --audit-level=high` and `npx wrangler deploy --dry-run` before `npm run deploy`. See `.github/workflows/checks.yml` for CI. Account is configured in wrangler.jsonc. AI calls and optional searches may incur charges.

## Knowledge and current research

The foundation is https://gdmissionsystems.ca/, supplemented by official GD parent-company financial reporting. This release contains **12 reviewed source summaries**, including customer concentration, product families, export contracts, undersea systems, Battle Lab and financial reporting. Historical figures retain reporting dates. They are not current-year estimates. Direct full-site crawling remains blocked by Azure WAF; exhaustive website/PDF ingestion has NOT been achieved. Never claim absolute expertise.

Optional on-demand Cloudflare Web Search performs up to two queries per researched response, prioritizing the Canadian site and then wider context. It requires `LIVE_RESEARCH=enabled` plus AI Gateway credits or a configured provider key. It is **currently disabled pending explicit user approval** for conversation-derived queries leaving the app. Provider failures and empty evidence are reported; the app must never manufacture live news or quotes. Search results are excerpts, not full-document verification. Retrieval timestamps are not publication dates. The local foundation uses weighted lexical retrieval, not a complete semantic index.

Company-specific factual claims require evidence. Stable general education is allowed. Hypotheticals distinguish assumptions, causal analysis and uncertainty; current factual premises require live evidence. Defence-stock discussions are educational, not individualized investment advice. The parent corporation is distinguished from its Canadian businesses. Sales popularity and largest-customer rankings require an explicit metric and documented support.

`knowledge/pages.json` records evidence provenance. `npm run import` checks source robots policy and downloads accessible HTML into ignored work files for manual review. It stops on inaccessible policies and does not bypass access controls. The URL manifest is incomplete. Full-site ingestion, autonomous refresh and PDF extraction remain future work.

## Privacy and interaction

Chat exists in tab memory; recent conversation is sent to Cloudflare Workers AI. If enabled, short context-derived search queries also go through Cloudflare Web Search to its search provider; avoid sensitive input. No app database stores conversations. Platform logs may retain metadata. Same-origin requests, bounded messages, rate limits, plain-text answer rendering and restrictive asset headers protect the surface. Public access has no account system or global spend cap.

Animation respects reduced-motion preferences and can be disabled. Response text is progressively revealed after receipt, not streamed from the model. Expressions are selected from interpreted intent and tone; they do not mean the mascot has emotions or universal human understanding.

Independent learning tool; not affiliated with General Dynamics. User-supplied and generated Josh artwork are project assets. Original GD trademarks and linked source content remain with their owners. Conversation-design references and artwork prompt are in knowledge/conversation-design.md.
