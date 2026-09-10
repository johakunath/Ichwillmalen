/* One drag at a time, with capture, cancellation and a tap alternative. */
(function () {
  let owner = null;
  window.PlayDrag = function (element, handlers) {
    let start = null,
      moving = false,
      id = null;
    const down = (e) => {
      if (owner || e.button > 0 || handlers.disabled?.()) return;
      owner = element;
      id = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      moving = false;
      element.setPointerCapture(id);
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      const delta = { x: e.clientX - start.x, y: e.clientY - start.y };
      if (!moving && Math.hypot(delta.x, delta.y) > 6) {
        moving = true;
        handlers.start?.(e, start);
      }
      if (moving) {
        handlers.move?.(e, delta);
        e.preventDefault();
      }
    };
    const end = (e) => {
      if (e.pointerId !== id) return;
      const cancelled = e.type !== "pointerup";
      id = null;
      owner = null;
      if (moving) handlers.end?.(e, cancelled);
      else if (!cancelled) handlers.tap?.(e);
      moving = false;
      start = null;
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    element.addEventListener("lostpointercapture", end);
    element.addEventListener("click", (e) => {
      if (e.detail === 0) handlers.tap?.(e);
    });
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.removeEventListener("lostpointercapture", end);
    };
  };
})();
