// CSS-pixel gesture thresholds are independent of screen density.
// A hold consumes the release even if it finds no removable piece.
export function installWorldGestures(canvas, handlers) {
  let press = null,
    timer = null;
  const clearTimer = () => {
    clearTimeout(timer);
    timer = null;
  };
  function cancel() {
    clearTimer();
    press = null;
    handlers.onIndicator?.(null);
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (press) {
      cancel();
      return;
    }
    if (!handlers.canStart()) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    press = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      drag: false,
      held: false,
    };
    handlers.onStart?.(press);
    timer = setTimeout(() => {
      if (!press || press.drag) return;
      press.held = true;
      handlers.onIndicator?.(null);
      handlers.onHold(press.x, press.y);
    }, 550);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.lastX,
      dy = e.clientY - press.lastY;
    if (
      !press.drag &&
      Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10
    ) {
      press.drag = true;
      clearTimer();
      handlers.onIndicator?.(null);
      handlers.onLook(e.clientX - press.x, e.clientY - press.y);
    } else if (press.drag) handlers.onLook(dx, dy);
    press.lastX = e.clientX;
    press.lastY = e.clientY;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!press || e.pointerId !== press.id) return;
    const ended = press;
    cancel();
    if (!ended.drag && !ended.held) handlers.onTap(ended.x, ended.y);
    handlers.onEnd?.();
  });
  for (const type of ["pointercancel", "lostpointercapture"])
    canvas.addEventListener(type, (e) => {
      if (press?.id === e.pointerId) cancel();
    });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  return { cancel };
}
