/* Fixed-resolution paper: rotation changes the camera, never the child's artwork. */
(async function () {
  const { actions } = Studio.mount("free");
  const canvas = document.getElementById("paper"),
    ctx = canvas.getContext("2d", { alpha: false });
  const stage = document.getElementById("drawing-stage"),
    hint = document.getElementById("drawing-hint");
  const WIDTH = 1600,
    HEIGHT = 1100,
    PAPER = "#FFFEF9",
    HISTORY_LIMIT = 8;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  let color = THEME.palette[1],
    brush = "pencil",
    size = 6,
    rainbow = false,
    mirror = false,
    hue = 0,
    hand = false;
  let undoStack = [],
    redoStack = [],
    active = null,
    stroke = null,
    zoom = 1,
    pan = { x: 0, y: 0 },
    fitScale = 1,
    minZoom = 1,
    pinch = null,
    gesture = false,
    ready = false;
  let penDown = false,
    hasArt = false,
    lastSave = Promise.resolve(),
    storageWarned = false;
  const pointers = new Map();
  const undo = Studio.button("undo", "Letzten Strich zurücknehmen", () =>
    restoreHistory(undoStack, redoStack),
  );
  const save = Studio.button("save", "Bild in Meine Bilder speichern", () =>
    Studio.save(canvas, "free", { image: canvas.toDataURL() }),
  );
  save.dataset.save = "";
  const newPage = Studio.button("new", "Neues Blatt", () =>
    Studio.confirmNew(() => {
      remember();
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      hasArt = false;
      resetCamera();
      changed();
    }),
  );
  const redo = Studio.button("redo", "Strich wiederholen", () =>
    restoreHistory(redoStack, undoStack),
  );
  const full = Studio.button("full", "Vollbild", () => {
    const mode = Tablet.state();
    const toggle = async () => {
      try {
        if (active !== null) endStroke();
        await Tablet.toggleFullscreen();
      } catch (_) {
        Studio.toast(
          "Vollbild ist hier nicht verfügbar. Öffne das Atelier als installierte App.",
        );
      }
    };
    if (mode.browserFullscreen) Tablet.forParents(toggle);
    else if (mode.fullscreen) Studio.toast("Du spielst bereits im Vollbild.");
    else toggle();
  });
  const fullscreenHost =
    window.frameElement?.id === "tablet-play-frame" ? parent : window;
  const updateFullscreen = () => {
    const mode = Tablet.state(),
      enabled = mode.fullscreen;
    full.classList.toggle("on", enabled);
    full.setAttribute("aria-pressed", String(enabled));
    full.title = mode.browserFullscreen
      ? "Vollbild verlassen · Für Erwachsene"
      : enabled
        ? "Vollbild ist aktiv"
        : "Vollbild";
  };
  fullscreenHost.addEventListener("tabletchange", updateFullscreen);
  addEventListener(
    "pagehide",
    () => fullscreenHost.removeEventListener("tabletchange", updateFullscreen),
    { once: true },
  );
  updateFullscreen();
  const zoomOut = Studio.button("minus", "Verkleinern", () =>
    zoomAt(zoom / 1.25),
  );
  const zoomIn = Studio.button("plus", "Vergrößern", () => zoomAt(zoom * 1.25));
  const fit = Studio.button("gallery", "Ganzes Blatt zeigen", () => {
    zoom = minZoom;
    pan = { x: 0, y: 0 };
    applyCamera();
  });
  const handBtn = Studio.button("hand", "Blatt verschieben", () => {
    hand = !hand;
    handBtn.classList.toggle("on", hand);
    handBtn.setAttribute("aria-pressed", String(hand));
    stage.classList.toggle("hand-mode", hand);
  });
  const view = document.createElement("div");
  view.className = "drawing-view-controls";
  view.append(handBtn, zoomOut, fit, zoomIn);
  actions.append(
    undo,
    redo,
    save,
    newPage,
    Studio.button("download", "Bild herunterladen", () =>
      Studio.download(canvas),
    ),
    full,
  );
  document.querySelector(".activity-header").insertBefore(view, actions);
  const ink = document.createElement("canvas");
  ink.width = WIDTH;
  ink.height = HEIGHT;
  const inkCtx = ink.getContext("2d");
  function snapshot() {
    const c = document.createElement("canvas");
    c.width = WIDTH;
    c.height = HEIGHT;
    c.getContext("2d").drawImage(canvas, 0, 0);
    return c;
  }
  function remember() {
    undoStack.push(snapshot());
    while (undoStack.length > HISTORY_LIMIT) release(undoStack.shift());
    redoStack.forEach(release);
    redoStack = [];
    updateUndo();
  }
  function release(c) {
    c.width = 0;
    c.height = 0;
  }
  function updateUndo() {
    undo.disabled = !undoStack.length;
    redo.disabled = !redoStack.length;
  }
  function restoreHistory(from, to) {
    if (!from.length || active !== null) return;
    to.push(snapshot());
    const c = from.pop();
    ctx.drawImage(c, 0, 0);
    release(c);
    hasArt = true;
    changed();
    updateUndo();
  }
  function changed() {
    hint.classList.toggle("hidden", hasArt);
    persist();
  }
  function persist() {
    if (!ready) return;
    const image = canvas.toDataURL("image/png");
    lastSave = lastSave
      .catch(() => {})
      .then(() => StudioStore.draft("free", { image, hasArt }))
      .catch(() => {
        if (!storageWarned) {
          Studio.toast(
            "Der Entwurf kann hier nicht gespeichert werden. Nutze „Herunterladen“.",
          );
          storageWarned = true;
        }
      });
  }
  document
    .querySelector(".home-button")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      if (active !== null) endStroke();
      await lastSave;
      location.href = "index.html";
    });
  function layout() {
    const r = stage.getBoundingClientRect();
    // The original document becomes hidden when fullscreen transfers to its frame.
    if (!r.width || !r.height) return;
    fitScale = Math.max(r.width / WIDTH, r.height / HEIGHT);
    minZoom = Math.min(r.width / WIDTH, r.height / HEIGHT) / fitScale;
    zoom = Math.max(minZoom, zoom);
    applyCamera();
  }
  function applyCamera() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const w = WIDTH * fitScale * zoom,
      h = HEIGHT * fitScale * zoom;
    pan.x = Math.max(
      -Math.max(0, (w - r.width) / 2),
      Math.min(Math.max(0, (w - r.width) / 2), pan.x),
    );
    pan.y = Math.max(
      -Math.max(0, (h - r.height) / 2),
      Math.min(Math.max(0, (h - r.height) / 2), pan.y),
    );
    zoomOut.disabled = zoom <= minZoom + 0.001;
    zoomIn.disabled = zoom >= 8;
    fit.title = "Ganzes Blatt zeigen · " + Math.round(zoom * 100) + "%";
    canvas.style.width = WIDTH * fitScale + "px";
    canvas.style.height = HEIGHT * fitScale + "px";
    canvas.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  }
  function zoomAt(value, clientX, clientY) {
    const r = stage.getBoundingClientRect();
    const x = (clientX ?? r.left + r.width / 2) - r.left - r.width / 2;
    const y = (clientY ?? r.top + r.height / 2) - r.top - r.height / 2;
    const next = Math.max(minZoom, Math.min(8, value));
    pan.x = x - ((x - pan.x) * next) / zoom;
    pan.y = y - ((y - pan.y) * next) / zoom;
    zoom = next;
    applyCamera();
  }
  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomAt(zoom * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
    },
    { passive: false },
  );
  function resetCamera() {
    zoom = 1;
    pan = { x: 0, y: 0 };
    layout();
  }
  function point(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * WIDTH,
      y: ((e.clientY - r.top) / r.height) * HEIGHT,
      p:
        e.pointerType === "pen" && e.pressure
          ? Math.max(0.15, e.pressure)
          : 0.5,
    };
  }
  const colors = document.getElementById("draw-colors");
  THEME.palette.forEach((value, i) => {
    const b = Studio.button(
      "",
      THEME.names[i],
      () => chooseColor(value),
      "paint-pot",
    );
    b.innerHTML = "<span></span>";
    b.style.setProperty("--paint", value);
    b.dataset.color = value;
    colors.append(b);
  });
  function chooseColor(value) {
    color = value;
    if (brush === "erase") chooseBrush("pencil");
    rainbow = false;
    rainbowBtn.classList.remove("on");
    rainbowBtn.setAttribute("aria-pressed", "false");
    colors.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.color === color);
      b.setAttribute("aria-pressed", String(b.dataset.color === color));
    });
  }
  const brushes = document.getElementById("draw-brushes");
  Brushes.tools.forEach(([key, label]) => {
    const b = Studio.button("", label, () => chooseBrush(key));
    b.innerHTML = Brushes.illustration(key);
    b.dataset.brush = key;
    brushes.append(b);
  });
  function chooseBrush(value) {
    brush = value;
    hand = false;
    handBtn.classList.remove("on");
    handBtn.setAttribute("aria-pressed", "false");
    stage.classList.remove("hand-mode");
    brushes.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.brush === brush);
      b.setAttribute("aria-pressed", String(b.dataset.brush === brush));
    });
  }
  const sizes = document.getElementById("draw-sizes");
  [1, 3, 6, 12, 24].forEach((n) => {
    const b = Studio.button("", "Pinselgröße " + n, () => {
      size = n;
      Studio.select(sizes, b);
    });
    b.dataset.size = n;
    b.innerHTML =
      '<span class="brush-dot" style="width:' +
      Math.max(2, n) +
      "px;height:" +
      Math.max(2, n) +
      'px"></span>';
    b.classList.toggle("on", n === size);
    b.setAttribute("aria-pressed", String(n === size));
    sizes.append(b);
  });
  const rainbowBtn = Studio.button("rainbow", "Regenbogenfarben", () => {
    rainbow = !rainbow;
    rainbowBtn.classList.toggle("on", rainbow);
    rainbowBtn.setAttribute("aria-pressed", String(rainbow));
  });
  const mirrorBtn = Studio.button("mirror", "Spiegelmalen", () => {
    mirror = !mirror;
    mirrorBtn.classList.toggle("on", mirror);
    mirrorBtn.setAttribute("aria-pressed", String(mirror));
  });
  document.getElementById("draw-magic").append(rainbowBtn, mirrorBtn);
  function drawSegment(a, b) {
    Brushes.render(
      inkCtx,
      a,
      b,
      { brush, size, color, rainbow, mirror, width: WIDTH, paper: PAPER },
      stroke,
    );
  }
  function composite() {
    ctx.drawImage(stroke.base, 0, 0);
    ctx.save();
    ctx.globalAlpha = Brushes.opacity(brush);
    ctx.drawImage(ink, 0, 0);
    ctx.restore();
  }
  function startStroke(e) {
    active = e.pointerId;
    const p = point(e);
    inkCtx.clearRect(0, 0, WIDTH, HEIGHT);
    stroke = { last: p, remaining: 0, hue, base: snapshot(), hadArt: hasArt };
    drawSegment(p, p);
    composite();
    hasArt = true;
    hint.classList.add("hidden");
  }
  function endStroke() {
    if (active === null) return;
    undoStack.push(stroke.base);
    while (undoStack.length > HISTORY_LIMIT) release(undoStack.shift());
    redoStack.forEach(release);
    redoStack = [];
    hue = stroke.hue;
    active = null;
    stroke = null;
    updateUndo();
    changed();
  }
  function cancelStroke() {
    if (active === null) return;
    ctx.drawImage(stroke.base, 0, 0);
    release(stroke.base);
    hasArt = stroke.hadArt;
    hint.classList.toggle("hidden", hasArt);
    active = null;
    stroke = null;
    updateUndo();
  }
  function geometry() {
    const [a, b] = Array.from(pointers.values());
    return {
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      d: Math.hypot(a.x - b.x, a.y - b.y),
    };
  }
  stage.addEventListener("pointerdown", (e) => {
    if (!ready || e.button > 0) return;
    if (e.pointerType === "pen") {
      penDown = true;
      if (active !== null) cancelStroke();
      pointers.clear();
      gesture = false;
      pinch = null;
    } else if (penDown || e.width > 50) return;
    if (pointers.size >= 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      cancelStroke();
      gesture = true;
      pinch = geometry();
    } else if (pointers.size === 1 && !gesture && !hand) startStroke(e);
    e.preventDefault();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const previousPointer = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (hand && !gesture) {
      pan.x += e.clientX - previousPointer.x;
      pan.y += e.clientY - previousPointer.y;
      applyCamera();
    } else if (gesture && pointers.size >= 2) {
      const g = geometry();
      if (pinch) {
        const previous = zoom;
        zoom = Math.max(
          minZoom,
          Math.min(8, (zoom * g.d) / Math.max(1, pinch.d)),
        );
        const r = stage.getBoundingClientRect(),
          cx = pinch.cx - (r.left + r.width / 2),
          cy = pinch.cy - (r.top + r.height / 2);
        pan.x = g.cx - pinch.cx + cx - ((cx - pan.x) * zoom) / previous;
        pan.y = g.cy - pinch.cy + cy - ((cy - pan.y) * zoom) / previous;
        applyCamera();
      }
      pinch = g;
    } else if (e.pointerId === active && stroke) {
      let events = e.getCoalescedEvents?.();
      if (!events?.length) events = [e];
      for (const event of events) {
        const p = point(event);
        drawSegment(stroke.last, p);
        stroke.last = p;
      }
      composite();
    }
    e.preventDefault();
  });
  function pointerEnd(e) {
    if (e.pointerType === "pen") penDown = false;
    pointers.delete(e.pointerId);
    if (e.pointerId === active) endStroke();
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) gesture = false;
  }
  stage.addEventListener("pointerup", pointerEnd);
  stage.addEventListener("pointercancel", pointerEnd);
  stage.addEventListener("lostpointercapture", pointerEnd);
  stage.addEventListener("contextmenu", (e) => e.preventDefault());
  new ResizeObserver(layout).observe(stage);
  chooseColor(color);
  chooseBrush(brush);
  updateUndo();
  hint.innerHTML = Icons("crayon");
  const idea = new URLSearchParams(location.search).get("idea");
  if (Art.names[idea]) {
    hint.innerHTML = Art.svg(idea);
    hint.setAttribute("aria-label", "Malidee: " + Art.names[idea]);
  }
  try {
    const id = new URLSearchParams(location.search).get("art");
    const transfer =
      window.frameElement?.id === "tablet-play-frame"
        ? parent.DrawingTransfer?.()
        : null;
    if (transfer) await transfer.pending;
    const saved =
      transfer ||
      (id
        ? (await StudioStore.get(id))?.data
        : await StudioStore.getDraft("free"));
    if (transfer) {
      undoStack = transfer.undoStack;
      redoStack = transfer.redoStack;
      chooseColor(transfer.color);
      chooseBrush(transfer.brush);
      size = transfer.size;
      Studio.select(sizes, sizes.querySelector('[data-size="' + size + '"]'));
      rainbow = transfer.rainbow;
      mirror = transfer.mirror;
      rainbowBtn.classList.toggle("on", rainbow);
      rainbowBtn.setAttribute("aria-pressed", String(rainbow));
      mirrorBtn.classList.toggle("on", mirror);
      mirrorBtn.setAttribute("aria-pressed", String(mirror));
      zoom = transfer.zoom;
      pan = transfer.pan;
      updateUndo();
    }
    if (saved?.image) {
      const im = new Image();
      im.src = saved.image;
      await im.decode();
      ctx.drawImage(im, 0, 0, WIDTH, HEIGHT);
      hasArt = saved.hasArt !== false;
      hint.classList.toggle("hidden", hasArt);
    }
  } catch (_) {}
  ready = true;
  canvas.dataset.ready = "true";
  if (window === window.top)
    window.DrawingTransfer = () => {
      if (active !== null) endStroke();
      const state = {
        image: canvas.toDataURL(),
        hasArt,
        brush,
        color,
        size,
        rainbow,
        mirror,
        zoom,
        pan: { ...pan },
        undoStack,
        redoStack,
        pending: lastSave,
      };
      ready = false;
      window.DrawingTransfer = null;
      // Ownership moves to the visible editor; do not retain old image buffers.
      undoStack = [];
      redoStack = [];
      canvas.width = ink.width = 1;
      canvas.height = ink.height = 1;
      return state;
    };
  layout();
})();
