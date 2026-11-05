export const STORAGE_KEY = "josh-conversations-v1";
export function readArchive(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { version: 1, active: null, chats: [] };
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.chats))
    throw Error("Saved history format is not supported.");
  const chats = data.chats
    .filter(
      (c) =>
        typeof c.id === "string" &&
        typeof c.title === "string" &&
        Array.isArray(c.messages),
    )
    .slice(0, 50)
    .map((c) => ({
      ...c,
      title: c.title.slice(0, 80),
      updatedAt:
        typeof c.updatedAt === "string" &&
        Number.isFinite(Date.parse(c.updatedAt))
          ? c.updatedAt
          : new Date(0).toISOString(),
      draft: typeof c.draft === "string" ? c.draft.slice(0, 3000) : "",
      messages: c.messages
        .filter(
          (m) =>
            m &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string",
        )
        .slice(0, 60)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 12000),
          sources: Array.isArray(m.sources)
            ? m.sources
                .filter((s) => {
                  try {
                    return (
                      typeof s.title === "string" &&
                      new URL(s.url).protocol === "https:"
                    );
                  } catch {
                    return false;
                  }
                })
                .slice(0, 12)
            : [],
          research:
            m.research && typeof m.research.status === "string"
              ? { status: m.research.status }
              : undefined,
        })),
    }));
  return {
    version: 1,
    active: chats.some((c) => c.id === data.active) ? data.active : null,
    chats,
  };
}
export function writeArchive(storage, archive) {
  storage.setItem(STORAGE_KEY, JSON.stringify(archive));
}
export function conversationContext(messages) {
  const result = [];
  let size = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (size + m.content.length > 48000) break;
    result.unshift({ role: m.role, content: m.content });
    size += m.content.length;
  }
  while (result.length && result[0].role !== "user") result.shift();
  return result;
}
