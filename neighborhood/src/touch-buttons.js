// Safari may emit MouseEvent clicks with no pointerType after pointerup.
// Handle a touch once, preserving native mouse/keyboard actions and horizontal scrolling.
export function installTouchButtons(root = document) {
  const presses = new Map();
  let firing = false,
    lastTouchFinish = -Infinity;
  root.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") lastTouchFinish = -Infinity;
      const button = e.target.closest?.("button");
      if (e.pointerType === "touch" && button && !button.disabled)
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
      const p = presses.get(e.pointerId);
      if (p) {
        lastTouchFinish = performance.now();
      }
      presses.delete(e.pointerId);
    },
    true,
  );
  root.addEventListener(
    "pointerup",
    (e) => {
      // World taps can open dialogs or preview controls beneath the finger too.
      if (e.pointerType === "touch" && e.target.closest?.("#world"))
        lastTouchFinish = performance.now();
      const p = presses.get(e.pointerId);
      presses.delete(e.pointerId);
      if (!p) return;
      lastTouchFinish = performance.now();
      const r = p.button.getBoundingClientRect();
      if (
        !p.moved &&
        !p.button.disabled &&
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
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
      const touchClick =
        e.pointerType === "touch" ||
        e.sourceCapabilities?.firesTouchEvents ||
        (!e.pointerType && e.detail > 0);
      if (!firing && touchClick && performance.now() - lastTouchFinish < 1200) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
