// Activate a touch button on pointer release. Some mobile browsers omit the
// synthesized click after canceled multi-touch / camera gestures. Preserve
// native keyboard and mouse click behavior and suppress only duplicate touch clicks.
export function installTouchButtons(root = document) {
  const presses = new Map(),
    activated = new WeakMap();
  root.addEventListener(
    "pointerdown",
    (e) => {
      const button = e.target.closest?.("button");
      if (e.pointerType === "touch" && button && !button.disabled)
        presses.set(e.pointerId, { button, x: e.clientX, y: e.clientY });
    },
    true,
  );
  root.addEventListener(
    "pointercancel",
    (e) => presses.delete(e.pointerId),
    true,
  );
  root.addEventListener(
    "pointerup",
    (e) => {
      const press = presses.get(e.pointerId);
      presses.delete(e.pointerId);
      if (!press) return;
      const r = press.button.getBoundingClientRect();
      if (
        !press.button.disabled &&
        Math.hypot(e.clientX - press.x, e.clientY - press.y) < 24 &&
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        activated.set(press.button, performance.now());
        e.preventDefault();
        press.button.click();
      }
    },
    true,
  );
  root.addEventListener(
    "click",
    (e) => {
      const button = e.target.closest?.("button"),
        last = button && activated.get(button);
      if (
        e.pointerType === "touch" &&
        last !== undefined &&
        performance.now() - last < 1200
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
