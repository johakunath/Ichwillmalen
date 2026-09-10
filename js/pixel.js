(async function () {
  const { actions } = Studio.mount("pixel");
  const cv = document.getElementById("pixel-paper"),
    ctx = cv.getContext("2d"),
    stage = document.getElementById("pixel-stage"),
    palette = document.getElementById("pixel-paints");
  let template = null,
    state = [],
    selected = 1,
    cell = 0,
    active = null,
    last = null,
    file = "",
    restored = null,
    history = [],
    version = 0,
    saveChain = Promise.resolve();
  const clone = () => state.map((row) => row.slice());
  const undo = Studio.button("undo", "Letzte Kästchen zurücknehmen", () => {
    if (history.length) {
      state = history.pop();
      draw();
      persist();
    }
    undo.disabled = !history.length;
  });
  undo.disabled = true;
  const save = Studio.button("save", "Kästchenbild speichern", () =>
    Studio.save(cv, "pixel", { file, state: clone() }),
  );
  save.dataset.save = "";
  actions.append(
    undo,
    save,
    Studio.button("new", "Ein neues Kästchenbild", () =>
      Studio.confirmNew(() => {
        remember();
        state = blank();
        draw();
        persist();
      }),
    ),
  );
  document
    .getElementById("pixel-tools")
    .append(
      Studio.button("gallery", "Ein anderes Kästchenbild", () =>
        Gallery.open(),
      ),
    );
  function blank() {
    return Array.from({ length: template.rows }, () =>
      Array(template.cols).fill(0),
    );
  }
  function remember() {
    history.push(clone());
    if (history.length > 20) history.shift();
    undo.disabled = false;
  }
  function persist() {
    if (!template) return;
    const data = { file, state: clone() };
    saveChain = saveChain
      .catch(() => {})
      .then(() => StudioStore.draft("pixel", data))
      .catch(() => {});
  }
  document
    .querySelector(".home-button")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      if (active !== null) persist();
      await saveChain;
      location.href = "index.html";
    });
  function layout() {
    if (!template) return;
    const r = stage.getBoundingClientRect();
    cell = Math.floor(
      Math.min(r.width / template.cols, r.height / template.rows),
    );
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = template.cols * cell * dpr;
    cv.height = template.rows * cell * dpr;
    cv.style.width = template.cols * cell + "px";
    cv.style.height = template.rows * cell + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    if (!template) return;
    ctx.fillStyle = "#E7EADC";
    ctx.fillRect(0, 0, template.cols * cell, template.rows * cell);
    for (let y = 0; y < template.rows; y++)
      for (let x = 0; x < template.cols; x++) {
        const color = state[y][x];
        ctx.fillStyle = color ? template.palette[color] : "#FFFEF9";
        ctx.beginPath();
        ctx.roundRect(
          x * cell + 2,
          y * cell + 2,
          cell - 4,
          cell - 4,
          Math.min(6, cell * 0.14),
        );
        ctx.fill();
        if (!color && template.target?.[y]?.[x]) {
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = template.palette[template.target[y][x]];
          ctx.beginPath();
          ctx.roundRect(
            x * cell + cell * 0.3,
            y * cell + cell * 0.3,
            cell * 0.4,
            cell * 0.4,
            cell * 0.1,
          );
          ctx.fill();
          ctx.restore();
        }
      }
  }
  function pickCell(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - r.left) / r.width) * template.cols),
      y: Math.floor(((e.clientY - r.top) / r.height) * template.rows),
    };
  }
  function paint(p) {
    if (p.x < 0 || p.y < 0 || p.x >= template.cols || p.y >= template.rows)
      return;
    state[p.y][p.x] = selected;
  }
  cv.addEventListener("pointerdown", (e) => {
    if (!template || active !== null || e.button > 0) return;
    active = e.pointerId;
    cv.setPointerCapture(active);
    remember();
    last = pickCell(e);
    paint(last);
    draw();
    e.preventDefault();
  });
  cv.addEventListener("pointermove", (e) => {
    if (e.pointerId !== active) return;
    const p = pickCell(e),
      steps = Math.max(Math.abs(p.x - last.x), Math.abs(p.y - last.y));
    for (let i = 0; i <= steps; i++)
      paint({
        x: Math.round(last.x + ((p.x - last.x) * i) / (steps || 1)),
        y: Math.round(last.y + ((p.y - last.y) * i) / (steps || 1)),
      });
    last = p;
    draw();
    e.preventDefault();
  });
  function end(e) {
    if (e.pointerId !== active) return;
    active = null;
    last = null;
    persist();
  }
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
  cv.addEventListener("lostpointercapture", end);
  function buildPalette() {
    palette.innerHTML = "";
    template.palette.forEach((color, i) => {
      const b = Studio.button(
        i === 0 ? "erase" : "",
        i === 0 ? "Radierer" : "Farbe " + i,
        () => {
          selected = i;
          Studio.select(palette, b);
        },
        i === 0 ? "" : "paint-pot",
      );
      if (i > 0) {
        b.innerHTML = "<span></span>";
        b.style.setProperty("--paint", color);
      }
      b.classList.toggle("on", i === selected);
      b.setAttribute("aria-pressed", String(i === selected));
      palette.append(b);
    });
  }
  async function load(item) {
    const token = ++version;
    try {
      const response = await fetch(item.file);
      if (!response.ok) throw Error("template");
      const data = await response.json();
      if (token !== version) return;
      template = data;
      file = item.file;
      selected = 1;
      state = blank();
      if (
        restored?.file === file &&
        restored.state?.length === template.rows &&
        restored.state.every(
          (row) =>
            row.length === template.cols &&
            row.every(
              (n) =>
                Number.isInteger(n) && n >= 0 && n < template.palette.length,
            ),
        )
      )
        state = restored.state;
      restored = null;
      history = [];
      undo.disabled = true;
      buildPalette();
      layout();
      persist();
    } catch (_) {
      Studio.toast("Dieses Kästchenbild konnte nicht geladen werden.");
    }
  }
  function thumb(item, el) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 160;
    el.append(c);
    fetch(item.file)
      .then((r) => r.json())
      .then((t) => {
        const x = c.getContext("2d"),
          size = 160 / Math.max(t.cols, t.rows);
        x.fillStyle = "#FFFEF9";
        x.fillRect(0, 0, 160, 160);
        for (let row = 0; row < t.rows; row++)
          for (let col = 0; col < t.cols; col++) {
            x.fillStyle = t.palette[t.target?.[row]?.[col] || 0];
            x.fillRect(col * size + 1, row * size + 1, size - 2, size - 2);
          }
        if (!t.target) {
          x.fillStyle = "#DDE5D2";
          for (let i = 0; i < 8; i++)
            x.fillRect((i + 3) * size, (i + 3) * size, size - 2, size - 2);
        }
      })
      .catch(() => {});
  }
  new ResizeObserver(layout).observe(stage);
  try {
    const id = new URLSearchParams(location.search).get("art");
    restored = id
      ? (await StudioStore.get(id))?.data
      : await StudioStore.getDraft("pixel");
  } catch (_) {}
  Gallery.init({
    key: "pixel",
    withLevels: true,
    defaultFile: "templates/pixel/blank.json",
    initialFile: restored?.file,
    renderThumb: thumb,
    onPick: load,
  });
})();
