# Josh Defense Bot

A simple chat window with an expressive Josh companion. Cloudflare serves the interface and AI backend. The conversation planner resolves follow-ups and selects social, research or analysis behavior before answering. The character has eight visual expression frames plus nod/breathing motion, faster natural blinks, greeting waves, curious typing reactions, thinking gestures and concerned reactions.

## Run and verify

Node 24+, `npm ci`, `npm run dev`. Cloudflare authentication is needed for remote AI. Run `npm run check`, `npm test`, `npm audit --audit-level=high` and `npx wrangler deploy --dry-run` before `npm run deploy`. See `.github/workflows/checks.yml` for CI. Account is configured in wrangler.jsonc. AI calls and optional searches may incur charges.

## Knowledge and current research

The foundation is https://gdmissionsystems.ca/, supplemented by official GD parent-company financial reporting. This release contains **12 reviewed source summaries**, including customer concentration, product families, export contracts, undersea systems, Battle Lab and financial reporting. Historical figures retain reporting dates. They are not current-year estimates. Direct full-site crawling remains blocked by Azure WAF; exhaustive website/PDF ingestion has NOT been achieved. Never claim absolute expertise.

On-demand public news research uses the same route found in Agent Finder: Google News query RSS, with GDELT as a fallback. No search API key or AI Gateway credits are required. Workers AI inference still uses the existing Cloudflare binding. Queries prioritize the Canadian official domain and relevant wider news; requests have timeouts, size limits and a ten-minute edge cache hint. Public feeds can be delayed, rate-limited or unavailable. This is news discovery, not comprehensive full-web search, verified article reading or live stock quotes. Links may lead through Google News to publishers. Dates and publisher attribution are retained in model evidence. Local company summaries remain the foundation.

The source indexes receive short conversation-derived keywords; this route was authorized by the user. Failures and empty results are explicit, and no news is fabricated. The local foundation uses weighted lexical retrieval rather than a complete semantic index.

Company-specific factual claims require evidence. Stable general education is allowed. Hypotheticals distinguish assumptions, causal analysis and uncertainty; current factual premises require live evidence. Defence-stock discussions are educational, not individualized investment advice. The parent corporation is distinguished from its Canadian businesses. Sales popularity and largest-customer rankings require an explicit metric and documented support.

`knowledge/pages.json` records evidence provenance. `npm run import` checks source robots policy and downloads accessible HTML into ignored work files for manual review. It stops on inaccessible policies and does not bypass access controls. The URL manifest is incomplete. Full-site ingestion, autonomous refresh and PDF extraction remain future work.

## Privacy and interaction

Conversations are stored in browser localStorage under josh-conversations-v1. Up to 50 conversations, each up to 60 messages, retain messages, source links and drafts. The oldest conversation is removed when the 50-chat cap is reached. New chats have separate memory. Reopening restores the saved conversation; up to 48,000 characters of its most recent context are sent to Cloudflare Workers AI. Long chats may exceed model recall; this is not unlimited memory. If enabled, short context-derived search queries also go to Google News RSS and, when needed, GDELT; avoid sensitive input. No app database stores conversations. Platform logs may retain metadata. Same-origin requests, bounded messages, rate limits, plain-text answer rendering and restrictive asset headers protect the surface. Public access has no account system or global spend cap.

Animation respects reduced-motion preferences and can be disabled. Response text is progressively revealed after receipt, not streamed from the model. Expressions are selected from interpreted intent and tone; they do not mean the mascot has emotions or universal human understanding.

Independent learning tool; not affiliated with General Dynamics. User-supplied and generated Josh artwork are project assets. Original GD trademarks and linked source content remain with their owners. Conversation-design references and artwork prompt are in knowledge/conversation-design.md.

## Cursor tracking and local history

A transparent nine-direction gaze sheet follows mouse/pen pointer movement with damped head rotation. Gaze pauses during emotes and resets when the pointer leaves, the page loses focus, or animation is disabled. Touch input does not trigger hover tracking. Reduced-motion settings disable tracking.

The history button opens saved conversations. New conversation also opens history so previous chats remain easy to find. History is browser/device-local, not synced to accounts or the server. Clearing site data removes it. Storage failures display a warning; corrupt archives are not overwritten. Per-chat deletion is available in the history panel. A previously open conversation from before this update cannot be recovered after refresh unless it was saved.

Gaze artwork: built-in image generator, existing Josh sprite as identity reference. Prompt: transparent registered 3x3 waist-up Josh gaze directions (upper-left/up/upper-right, left/center/right, lower-left/down/lower-right), head and pupils turn subtly, torso and identity preserved. A second edit removed residual background. Saved asset: public/josh-gaze.png.
