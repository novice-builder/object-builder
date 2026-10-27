// The browser's pointer target is the hit-test result, including CSS transforms,
// visual viewport scaling and button children. Do not reject it using a second
// coordinate/rectangle test. A native compatibility click may have NO metadata.
export function installTouchButtons(root = document) {
  const presses = new Map();
  let firing = false,
    suppressUntil = 0;
  root.addEventListener(
    "pointerdown",
    (e) => {
      suppressUntil = 0;
      const button = e.target.closest?.("button");
      if (
        (e.pointerType === "touch" || e.pointerType === "pen") &&
        button &&
        !button.disabled
      )
        presses.set(e.pointerId, {
          button,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        });
    },
    true,
  );
  root.addEventListener(
    "keydown",
    () => {
      suppressUntil = 0;
    },
    true,
  );
  root.addEventListener(
    "pointermove",
    (e) => {
      const p = presses.get(e.pointerId);
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10)
        p.moved = true;
    },
    true,
  );
  root.addEventListener(
    "pointercancel",
    (e) => {
      if (presses.has(e.pointerId)) suppressUntil = performance.now() + 900;
      presses.delete(e.pointerId);
    },
    true,
  );
  root.addEventListener(
    "pointerup",
    (e) => {
      const p = presses.get(e.pointerId);
      presses.delete(e.pointerId);
      if (
        (e.pointerType === "touch" || e.pointerType === "pen") &&
        e.target.closest?.("#world")
      )
        suppressUntil = performance.now() + 900;
      if (!p) return;
      suppressUntil = performance.now() + 900;
      if (!p.moved && !p.button.disabled && p.button.isConnected !== false) {
        e.preventDefault();
        firing = true;
        try {
          p.button.click();
        } finally {
          firing = false;
        }
      }
    },
    true,
  );
  root.addEventListener(
    "click",
    (e) => {
      // Keep export anchors, text fields and native file pickers functional. Any new
      // pointerdown/keydown starts a new intentional action and clears suppression.
      const control = e.target.closest?.("button,summary,.file-button");
      if (!firing && control && performance.now() < suppressUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
