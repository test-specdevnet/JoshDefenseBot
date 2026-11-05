import { readArchive, writeArchive, conversationContext } from "./history.js";
export function initHistory({
  messages,
  input,
  add,
  isBusy,
  onRestore,
  onError,
}) {
  let archive = { version: 1, active: null, chats: [] },
    failed = false;
  try {
    archive = readArchive(localStorage);
  } catch {
    failed = true;
    onError(
      "Saved history could not be loaded. Existing browser data has been left untouched.",
    );
  }
  function current() {
    return archive.chats.find((c) => c.id === archive.active);
  }
  function persist() {
    if (failed) return;
    try {
      writeArchive(localStorage, archive);
    } catch {
      onError(
        "Browser storage is full or unavailable. This conversation will not survive a refresh until storage is available.",
      );
    }
  }
  function fresh() {
    const empty = archive.chats.find((c) => !c.messages.length && !c.draft);
    if (empty) {
      archive.active = empty.id;
      return empty;
    }
    const c = {
      id: crypto.randomUUID(),
      title: "New conversation",
      updatedAt: new Date().toISOString(),
      messages: [],
      draft: "",
    };
    archive.chats.unshift(c);
    archive.chats = archive.chats.slice(0, 50);
    archive.active = c.id;
    return c;
  }
  async function render() {
    const c = current() || fresh();
    messages.replaceChildren();
    if (c.messages.length) {
      for (const m of c.messages) {
        await add(m.role, m.content, m.sources, false);
        if (
          m.role === "assistant" &&
          m.research &&
          !["live", "not-needed"].includes(m.research.status)
        ) {
          const n = document.createElement("small");
          n.className = "research-note";
          n.textContent =
            "Saved answer — research may have been incomplete at the time.";
          messages.lastElementChild.append(n);
        }
      }
    } else {
      const w = document.createElement("div");
      w.id = "welcome";
      const h = document.createElement("h1");
      h.textContent = "Hey, I’m Josh.";
      const p = document.createElement("p");
      p.textContent =
        "What would you like to learn about GD Mission Systems–Canada?";
      w.append(h, p);
      messages.append(w);
    }
    input.value = c.draft || "";
    onRestore(c.messages.map((m) => ({ ...m })));
    $("#chat-title").textContent = c.title;
    persist();
  }
  const $ = (s) => document.querySelector(s);
  function list() {
    const container = $("#chat-list");
    container.replaceChildren();
    archive.chats
      .filter((c) => c.messages.length || c.draft)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .forEach((c) => {
        const row = document.createElement("div");
        row.className = "history-row";
        const button = document.createElement("button");
        button.className = "open-chat";
        button.textContent = c.title;
        button.setAttribute("aria-current", String(c.id === archive.active));
        const date = document.createElement("small");
        date.textContent = new Date(c.updatedAt).toLocaleString();
        button.append(date);
        button.addEventListener("click", async () => {
          if (isBusy()) return;
          archive.active = c.id;
          await render();
          $("#history-dialog").close();
          input.focus();
        });
        const remove = document.createElement("button");
        remove.className = "delete-chat";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete ${c.title}`);
        remove.addEventListener("click", async () => {
          if (isBusy()) return;
          archive.chats = archive.chats.filter((x) => x.id !== c.id);
          if (archive.active === c.id) {
            archive.active = null;
            fresh();
            await render();
          }
          persist();
          list();
        });
        row.append(button, remove);
        container.append(row);
      });
    if (!container.children.length)
      container.textContent = "Your conversations will appear here.";
  }
  $("#history").addEventListener("click", () => {
    if (isBusy()) return;
    list();
    $("#history-dialog").showModal();
  });
  $("#close-history").addEventListener("click", () =>
    $("#history-dialog").close(),
  );
  $("#new-chat").addEventListener("click", async () => {
    if (isBusy()) return;
    const previous = current();
    if (previous) {
      previous.draft = input.value;
      persist();
    }
    fresh();
    await render();
    list();
    $("#history-dialog").showModal();
  });
  $("#start-chat").addEventListener("click", async () => {
    if (isBusy()) return;
    fresh();
    await render();
    $("#history-dialog").close();
    input.focus();
  });
  let draftTimer;
  input.addEventListener("input", () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const c = current();
      if (c) {
        c.draft = input.value;
        persist();
      }
    }, 250);
  });
  window.addEventListener("pagehide", () => {
    const c = current();
    if (c) c.draft = input.value;
    persist();
  });
  const ready = render();
  return {
    ready,
    save(history) {
      const c = current();
      c.messages = history.map((m) => ({ ...m }));
      c.draft = input.value;
      c.updatedAt = new Date().toISOString();
      c.title =
        history
          .find((m) => m.role === "user")
          ?.content.replace(/\s+/g, " ")
          .slice(0, 65) || "New conversation";
      $("#chat-title").textContent = c.title;
      persist();
    },
    context: conversationContext,
  };
}
