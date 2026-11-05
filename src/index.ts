import { pages, retrieve } from "./retrieval";
import { planConversation, research, systemPrompt } from "./conversation";
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/coverage")
      return json({
        complete: false,
        documents: pages.length,
        sources: pages.map(({ title, url, verified, method }) => ({
          title,
          url,
          verified,
          method,
        })),
        note: "Curated official-source foundation plus optional on-demand web research. Website coverage is not exhaustive. Current claims require retrieved evidence.",
      });
    if (url.pathname !== "/api/chat") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    if (request.headers.get("Origin") !== url.origin)
      return json({ error: "Request origin not allowed." }, 403);
    if (
      !(
        await env.CHAT_LIMIT.limit({
          key: request.headers.get("CF-Connecting-IP") ?? "local",
        })
      ).success
    )
      return json(
        { error: "Please wait a minute before sending more messages." },
        429,
      );
    try {
      if (!request.headers.get("content-type")?.includes("application/json"))
        return json({ error: "JSON is required." }, 415);
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "Message body required." }, 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 64000) {
          await reader.cancel();
          return json(
            { error: "Conversation is too long. Start a new chat." },
            413,
          );
        }
        chunks.push(part.value);
      }
      const combined = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const raw = new TextDecoder().decode(combined);
      const body = JSON.parse(raw) as {
        messages?: { role: string; content: string }[];
        mode?: string;
      };
      if (
        !Array.isArray(body.messages) ||
        !body.messages.length ||
        body.messages.length > 60 ||
        body.messages.some(
          (m) =>
            !m ||
            !["user", "assistant"].includes(m.role) ||
            typeof m.content !== "string" ||
            m.content.length > (m.role === "assistant" ? 12000 : 3000),
        ) ||
        body.messages.at(-1)?.role !== "user"
      )
        return json(
          { error: "Send a message of up to 3,000 characters." },
          400,
        );
      const history = body.messages;
      const plan = await planConversation(env.AI, history);
      const live =
        String(env.LIVE_RESEARCH) === "enabled"
          ? await research(env.AI, plan)
          : {
              sources: [],
              status: plan.intent === "social" ? "not-needed" : "disabled",
            };
      const local = plan.intent === "social" ? [] : retrieve(plan.query);
      const seen = new Set<string>();
      const sources = [...live.sources, ...local]
        .filter((s) => !seen.has(s.url) && !!seen.add(s.url))
        .slice(0, 12);
      const system = systemPrompt(plan, sources, live.status);
      const result = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            { role: "system", content: system },
            ...history.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          max_tokens: 1100,
          temperature: 0.35,
        },
      );
      if (
        typeof result !== "object" ||
        !result ||
        !("response" in result) ||
        typeof result.response !== "string"
      )
        throw new Error("Invalid AI response");
      return json({
        answer: result.response,
        expression: plan.expression,
        research: { status: live.status, checkedAt: new Date().toISOString() },
        sources: sources.map(({ title, url, verified }) => ({
          title,
          url,
          verified,
        })),
      });
    } catch (error) {
      if (error instanceof SyntaxError)
        return json({ error: "The message could not be read." }, 400);
      console.error(
        JSON.stringify({
          event: "chat_failed",
          type: error instanceof Error ? error.name : "unknown",
        }),
      );
      return json(
        { error: "Josh is temporarily unavailable. Please try again shortly." },
        503,
      );
    }
  },
} satisfies ExportedHandler<Env>;
