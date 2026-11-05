let history = [],
  mode = "chat",
  busy = false;
const $ = (s) => document.querySelector(s);
const messages = $("#messages"),
  input = $("#message");
function add(role, content, sources = []) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const who = document.createElement("span");
  who.className = "who";
  who.textContent = role === "user" ? "YOU" : "JOSH / YOUR FIELD GUIDE";
  const text = document.createElement("div");
  text.textContent = content;
  article.append(who, text);
  if (sources.length) {
    const links = document.createElement("div");
    links.className = "sources";
    sources.forEach((s, i) => {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = `[${i + 1}] ${s.title} ↗`;
      links.append(a);
    });
    article.append(links);
  }
  messages.append(article);
  article.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
async function send(text) {
  if (busy || !text.trim()) return;
  if (history.length >= 20) {
    $("#notice").textContent = "Start a new conversation to keep learning.";
    return;
  }
  busy = true;
  $("#send").disabled = true;
  input.disabled = true;
  $("#welcome").hidden = true;
  $("#welcome").style.display = "none";
  $("#starters").hidden = true;
  add("user", text);
  history.push({ role: "user", content: text });
  input.value = "";
  $("#notice").textContent = "Josh is checking the field notes…";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, mode }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to reach Josh.");
    history.push({ role: "assistant", content: data.answer });
    add("assistant", data.answer, data.sources);
    $("#notice").textContent = "";
  } catch (e) {
    history.pop();
    input.value = text;
    $("#notice").textContent =
      e.name === "TimeoutError"
        ? "Josh took too long. Your message is ready to retry."
        : e.message;
  } finally {
    busy = false;
    $("#send").disabled = false;
    input.disabled = false;
    input.focus();
  }
}
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  void send(input.value);
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    void send(input.value);
  }
});
document
  .querySelectorAll("[data-prompt]")
  .forEach((b) =>
    b.addEventListener("click", () => void send(b.dataset.prompt)),
  );
document.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document
      .querySelectorAll("[data-mode]")
      .forEach((n) => n.classList.toggle("active", n === b));
    $("#mode-label").textContent = b.textContent.replace(/\d/g, "").trim();
    input.placeholder =
      mode === "quiz"
        ? "Choose a topic for a one-question-at-a-time quiz…"
        : mode === "recap"
          ? "What would you like to recap?"
          : "Ask Josh about GD Mission Systems–Canada…";
    input.focus();
  }),
);
$("#new-chat").addEventListener("click", () => {
  if (busy) return;
  history = [];
  messages.replaceChildren();
  $("#welcome").hidden = false;
  $("#welcome").style.display = "";
  $("#starters").hidden = false;
  $("#notice").textContent = "";
  input.value = "";
  input.focus();
});
$("#coverage").addEventListener("click", async () => {
  try {
    const data = await (await fetch("/api/coverage")).json();
    $("#coverage-note").textContent = data.note;
    $("#source-list").replaceChildren();
    data.sources.forEach((s) => {
      const li = document.createElement("li"),
        a = document.createElement("a");
      a.href = s.url;
      a.textContent = s.title;
      a.target = "_blank";
      a.rel = "noopener";
      li.append(
        a,
        document.createTextNode(` — checked ${s.verified}. ${s.method}`),
      );
      $("#source-list").append(li);
    });
    $("#coverage-dialog").showModal();
  } catch {
    $("#notice").textContent =
      "Coverage details are unavailable. Please try again.";
  }
});
$("#close-dialog").addEventListener("click", () =>
  $("#coverage-dialog").close(),
);
