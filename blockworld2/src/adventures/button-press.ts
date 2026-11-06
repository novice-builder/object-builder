/** Responsive touch/pen presses without relying on delayed compatibility clicks. */
export function bindButton(element: HTMLElement, action: () => void) {
  let pending: { id: number; x: number; y: number } | null = null;
  let ignorePointerClickUntil = 0;
  element.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || !["touch", "pen"].includes(e.pointerType)) return;
    pending = { id: e.pointerId, x: e.clientX, y: e.clientY };
    element.setPointerCapture(e.pointerId);
  });
  element.addEventListener("pointerup", (e) => {
    const down = pending;
    if (!down || down.id !== e.pointerId) return;
    pending = null;
    ignorePointerClickUntil = performance.now() + 650;
    const r = element.getBoundingClientRect();
    if (
      r.width > 0 &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12 &&
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    ) {
      e.preventDefault();
      action();
    }
  });
  for (const event of ["pointercancel", "lostpointercapture"])
    element.addEventListener(event, () => {
      pending = null;
    });
  window.addEventListener("blur", () => {
    pending = null;
  });
  element.addEventListener("click", (e) => {
    // Keyboard and Gamepad API .click() have detail 0 and always remain available.
    if (e.detail > 0 && performance.now() < ignorePointerClickUntil) return;
    action();
  });
}
