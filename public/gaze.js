export function initGaze(josh, enabled) {
  let frame = 0,
    target = { x: 0, y: 0 },
    active = false;
  const reset = () => {
    active = false;
    josh.removeAttribute("data-gaze");
    josh.style.setProperty("--look-x", "0deg");
    josh.style.setProperty("--look-y", "0deg");
  };
  function update() {
    frame = 0;
    if (!enabled() || !active) {
      reset();
      return;
    }
    const box = josh.getBoundingClientRect();
    const dx = Math.max(
      -1,
      Math.min(
        1,
        (target.x - (box.left + box.width / 2)) / (innerWidth * 0.45),
      ),
    );
    const dy = Math.max(
      -1,
      Math.min(
        1,
        (target.y - (box.top + box.height * 0.25)) / (innerHeight * 0.45),
      ),
    );
    let col = dx < -0.18 ? 0 : dx > 0.18 ? 2 : 1;
    const row = dy < -0.18 ? 0 : dy > 0.18 ? 2 : 1;
    if (row === 0) col = 2 - col;
    josh.dataset.gaze = String(row * 3 + col);
    josh.style.setProperty("--gaze-x", col * 50 + "%");
    josh.style.setProperty("--gaze-y", row * 50 + "%");
    josh.style.setProperty("--look-x", -dy * 3 + "deg");
    josh.style.setProperty("--look-y", dx * 4 + "deg");
  }
  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch" || !enabled()) return;
      active = true;
      target = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", reset);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  return reset;
}
