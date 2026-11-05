let history = [],
  busy = false,
  animationEnabled = !matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s),
  messages = $("#messages"),
  input = $("#message"),
  josh = $("#josh");
let expressionTimer;
function emote(expression, duration = 1000) {
  clearTimeout(expressionTimer);
  if (!animationEnabled) return;
  josh.dataset.expression = expression;
  josh.setAttribute(
    "aria-label",
    `Josh ${expression === "thumbs" ? "giving a thumbs up" : expression === "blink" ? "blinking" : expression === "nod" ? "nodding" : "smiling"}`,
  );
  expressionTimer = setTimeout(() => {
    josh.dataset.expression = "idle";
    josh.setAttribute("aria-label", "Josh smiling");
  }, duration);
}
function syncMotion() {
  document.body.classList.toggle("motion-off", !animationEnabled);
  $("#motion").textContent = animationEnabled
    ? "Animation on"
    : "Animation off";
  $("#motion").setAttribute("aria-pressed", String(animationEnabled));
  if (!animationEnabled) {
    clearTimeout(expressionTimer);
    josh.dataset.expression = "idle";
  }
}
syncMotion();
$("#motion").addEventListener("click", () => {
  animationEnabled = !animationEnabled;
  syncMotion();
});
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    animationEnabled = !e.matches;
    syncMotion();
  },
);
function scheduleBlink() {
  setTimeout(
    () => {
      if (!document.hidden && josh.dataset.expression === "idle")
        emote("blink", 170);
      scheduleBlink();
    },
    3800 + Math.random() * 3000,
  );
}
scheduleBlink();
function scrollChat() {
  messages.scrollTop = messages.scrollHeight;
}
async function add(role, content, sources = [], reveal = false) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  if (role === "assistant") {
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = "Josh";
    article.append(who);
  }
  const text = document.createElement("div");
  text.className = "text";
  article.append(text);
  messages.append(article);
  if (reveal && animationEnabled) {
    // Reveal complete words after the server response arrives; this is presentation, not network streaming.
    const words = content.match(/\S+\s*/g) || [];
    article.setAttribute("aria-busy", "true");
    for (let i = 0; i < words.length; i += 3) {
      text.textContent += words.slice(i, i + 3).join("");
      if (i % 36 === 0) emote(i % 72 === 0 ? "nod" : "smile", 850);
      scrollChat();
      await new Promise((r) => setTimeout(r, 38));
    }
    article.removeAttribute("aria-busy");
  } else text.textContent = content;
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
  scrollChat();
}
async function send(text) {
  if (busy || !text.trim()) return;
  if (history.length >= 20) {
    $("#notice").textContent =
      "Start a new conversation using + to keep learning.";
    return;
  }
  busy = true;
  $("#send").disabled = true;
  $("#new-chat").disabled = true;
  input.disabled = true;
  $("#welcome")?.remove();
  await add("user", text);
  history.push({ role: "user", content: text });
  input.value = "";
  input.style.height = "";
  $("#notice").textContent = "";
  $("#josh-status").textContent = "Checking my field notes…";
  emote("nod", 1000);
  const thinking = setInterval(() => emote("nod", 1000), 4200);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, mode: "chat" }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to reach Josh.");
    clearInterval(thinking);
    $("#josh-status").textContent = "Here’s what I found.";
    await add("assistant", data.answer, data.sources, true);
    history.push({ role: "assistant", content: data.answer });
    // Acknowledgement gestures only for positive conversational cues, never for uncertain answers.
    emote(
      /\b(thanks|thank you|got it|understand)\b/i.test(text)
        ? "thumbs"
        : "smile",
      1800,
    );
    $("#josh-status").textContent = "Listening.";
  } catch (e) {
    history.pop();
    input.value = text;
    $("#notice").textContent =
      e.name === "TimeoutError"
        ? "That took too long. Your message is ready to retry."
        : e.message;
    $("#josh-status").textContent = "Let’s try that again.";
    josh.dataset.expression = "idle";
  } finally {
    clearInterval(thinking);
    busy = false;
    $("#send").disabled = false;
    $("#new-chat").disabled = false;
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
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 130) + "px";
});
$("#new-chat").addEventListener("click", () => {
  if (busy) return;
  history = [];
  messages.replaceChildren();
  const welcome = document.createElement("div");
  welcome.id = "welcome";
  const h = document.createElement("h1");
  h.textContent = "Hey, I’m Josh.";
  const p = document.createElement("p");
  p.textContent =
    "What would you like to learn about GD Mission Systems–Canada?";
  welcome.append(h, p);
  messages.append(welcome);
  $("#notice").textContent = "";
  $("#josh-status").textContent = "Ready when you are.";
  input.value = "";
  input.style.height = "";
  emote("nod");
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
