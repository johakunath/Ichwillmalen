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
    brush = "crayon",
    size = 16,
    rainbow = false,
    mirror = false,
    hue = 0;
  let undoStack = [],
    redoStack = [],
    active = null,
    stroke = null,
    zoom = 1,
    pan = { x: 0, y: 0 },
    fitScale = 1,
    pinch = null,
    gesture = false,
    ready = false;
  let penNear = -Infinity,
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
  actions.append(undo, save, newPage);
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
    fitScale = Math.min(r.width / WIDTH, r.height / HEIGHT);
    applyCamera();
  }
  function applyCamera() {
    const r = stage.getBoundingClientRect(),
      w = WIDTH * fitScale * zoom,
      h = HEIGHT * fitScale * zoom;
    pan.x = Math.max(
      -Math.max(0, (w - r.width) / 2),
      Math.min(Math.max(0, (w - r.width) / 2), pan.x),
    );
    pan.y = Math.max(
      -Math.max(0, (h - r.height) / 2),
      Math.min(Math.max(0, (h - r.height) / 2), pan.y),
    );
    canvas.style.width = WIDTH * fitScale + "px";
    canvas.style.height = HEIGHT * fitScale + "px";
    canvas.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  }
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
  // Six everyday paints are always visible. The full palette lives in the tool box.
  [1, 2, 3, 4, 6, 8].forEach((i) => {
    const b = Studio.button(
      "",
      THEME.names[i],
      () => chooseColor(THEME.palette[i]),
      "paint-pot",
    );
    b.innerHTML = "<span></span>";
    b.style.setProperty("--paint", THEME.palette[i]);
    b.dataset.color = THEME.palette[i];
    colors.append(b);
  });
  function chooseColor(value) {
    color = value;
    if (brush === "erase") chooseBrush("crayon");
    rainbow = false;
    rainbowBtn.classList.remove("on");
    rainbowBtn.setAttribute("aria-pressed", "false");
    colors.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.color === color);
      b.setAttribute("aria-pressed", String(b.dataset.color === color));
    });
  }
  const brushes = document.getElementById("draw-brushes");
  [
    ["crayon", "Wachsmaler"],
    ["brush", "Pinsel"],
    ["erase", "Radierer"],
  ].forEach(([key, label]) => {
    const b = Studio.button(key, label, () => chooseBrush(key));
    b.dataset.brush = key;
    brushes.append(b);
  });
  function chooseBrush(value) {
    brush = value;
    brushes.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.brush === brush);
      b.setAttribute("aria-pressed", String(b.dataset.brush === brush));
    });
  }
  const rainbowBtn = Studio.button("rainbow", "Regenbogenfarben", () => {
    rainbow = !rainbow;
    rainbowBtn.classList.toggle("on", rainbow);
    rainbowBtn.setAttribute("aria-pressed", String(rainbow));
  });
  document
    .getElementById("draw-magic")
    .append(
      rainbowBtn,
      Studio.button("more", "Mehr Farben und Werkzeuge", toolbox),
    );
  function toolbox() {
    const options = document.createElement("div");
    options.className = "tool-options";
    const heading = (text) => {
      const h = document.createElement("h3");
      h.textContent = text;
      options.append(h);
    };
    heading("Deine Farben");
    const palette = document.createElement("div");
    palette.className = "dock-group";
    palette.style.flexWrap = "wrap";
    Studio.colors(palette, chooseColor, color);
    options.append(palette);
    heading("Deine Werkzeuge");
    [
      ["crayon", "Wachsmaler"],
      ["brush", "Pinsel"],
      ["marker", "Filzstift"],
      ["water", "Wasserfarbe"],
      ["star", "Sternenstaub"],
    ].forEach(([key, label]) => {
      const b = Studio.button(
        key,
        label,
        () => {
          chooseBrush(key);
          dialog.close();
        },
        "with-label",
      );
      const t = document.createElement("span");
      t.className = "tool-option-label";
      t.textContent = label;
      b.append(t);
      b.classList.toggle("on", brush === key);
      options.append(b);
    });
    heading("Klein, mittel, groß");
    [8, 16, 32].forEach((n) => {
      const b = Studio.button("", `Pinselgröße ${n}`, () => {
        size = n;
        dialog.close();
      });
      b.innerHTML = `<span class="brush-dot" style="width:${n}px;height:${n}px"></span>`;
      b.classList.toggle("on", size === n);
      options.append(b);
    });
    heading("Ein bisschen Magie");
    const mirrorBtn = Studio.button(
      "mirror",
      "Spiegelmalen",
      () => {
        mirror = !mirror;
        mirrorBtn.classList.toggle("on", mirror);
        mirrorBtn.setAttribute("aria-pressed", String(mirror));
      },
      "wide",
    );
    mirrorBtn.append(" Spiegel");
    mirrorBtn.classList.toggle("on", mirror);
    mirrorBtn.setAttribute("aria-pressed", String(mirror));
    options.append(mirrorBtn);
    heading("Dein Blatt");
    options.append(
      Studio.button("full", "Ganzes Blatt zeigen", () => {
        resetCamera();
        dialog.close();
      }),
      Studio.button("redo", "Strich wiederholen", () => {
        restoreHistory(redoStack, undoStack);
        dialog.close();
      }),
      Studio.button("download", "Bild herunterladen", () =>
        Studio.download(canvas),
      ),
    );
    const dialog = Studio.modal("Die kleine Werkzeugkiste", options);
  }
  function drawSegment(a, b) {
    const pressure = (a.p + b.p) / 2,
      w = size * (0.65 + pressure),
      col =
        brush === "erase"
          ? PAPER
          : rainbow
            ? `hsl(${(hue = (hue + 1.4) % 360)} 67% 62%)`
            : color;
    function line(ax, ay, bx, by) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    const stampDue =
      brush === "star" &&
      (!stroke.stamp ||
        Math.hypot(b.x - stroke.stamp.x, b.y - stroke.stamp.y) > size * 2);
    const stampRadius = size * (0.7 + Math.random() * 0.5);
    if (stampDue) stroke.stamp = { x: b.x, y: b.y };
    function paint(ax, ay, bx, by) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = w;
      if (brush === "water") {
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = w * 3;
        ctx.shadowColor = col;
        ctx.shadowBlur = w * 0.7;
        line(ax, ay, bx, by);
      } else if (brush === "brush") {
        ctx.lineWidth = w * 1.7;
        ctx.globalAlpha = 0.75;
        line(ax, ay, bx, by);
      } else if (brush === "star") {
        if (stampDue) {
          const radius = stampRadius;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 ? radius * 0.45 : radius;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const x = bx + Math.cos(angle) * r,
              y = by + Math.sin(angle) * r;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }
      } else if (brush === "erase") {
        ctx.lineWidth = w * 3;
        line(ax, ay, bx, by);
      } else if (brush === "crayon") {
        ctx.globalAlpha = 0.9;
        line(ax, ay, bx, by);
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = w * 1.35;
        line(ax, ay, bx, by);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = PAPER;
        const n = Math.min(
          24,
          Math.ceil((Math.hypot(bx - ax, by - ay) * w) / 10),
        );
        for (let i = 0; i < n; i++) {
          const t = Math.random();
          ctx.fillRect(
            ax + (bx - ax) * t + (Math.random() - 0.5) * w,
            ay + (by - ay) * t + (Math.random() - 0.5) * w,
            1.1,
            1.1,
          );
        }
      } else line(ax, ay, bx, by);
      ctx.restore();
    }
    paint(a.x, a.y, b.x, b.y);
    if (mirror) paint(WIDTH - a.x, a.y, WIDTH - b.x, b.y);
  }
  function startStroke(e) {
    remember();
    active = e.pointerId;
    const p = point(e);
    stroke = { last: p, stamp: null };
    drawSegment(p, { ...p, x: p.x + 0.01 });
    hasArt = true;
    hint.classList.add("hidden");
  }
  function endStroke() {
    if (active === null) return;
    active = null;
    stroke = null;
    changed();
  }
  function cancelStroke() {
    if (active === null) return;
    const before = undoStack.pop();
    if (before) {
      ctx.drawImage(before, 0, 0);
      release(before);
    }
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
      penNear = performance.now();
      if (active !== null) cancelStroke();
      pointers.clear();
      gesture = false;
      pinch = null;
    } else if (performance.now() - penNear < 500 || e.width > 50) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      cancelStroke();
      gesture = true;
      pinch = geometry();
    } else if (pointers.size === 1 && !gesture) startStroke(e);
    e.preventDefault();
  });
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerType === "pen") penNear = performance.now();
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture && pointers.size >= 2) {
      const g = geometry();
      if (pinch) {
        const previous = zoom;
        zoom = Math.max(1, Math.min(4, (zoom * g.d) / Math.max(1, pinch.d)));
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
    }
    e.preventDefault();
  });
  function pointerEnd(e) {
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
    const saved = id
      ? (await StudioStore.get(id))?.data
      : await StudioStore.getDraft("free");
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
  layout();
})();
