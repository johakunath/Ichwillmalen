(async function () {
  const { actions } = Studio.mount("water");
  const under = document.getElementById("under"),
    cover = document.getElementById("cover"),
    uctx = under.getContext("2d"),
    ctx = cover.getContext("2d", { willReadFrequently: true }),
    frame = document.getElementById("water-paper");
  const hint = document.getElementById("water-hint");
  hint.innerHTML = Icons("water");
  let file = "",
    radius = 48,
    active = null,
    last = null,
    version = 0,
    ready = false,
    restored = null,
    history = [],
    changed = false,
    saveChain = Promise.resolve(),
    warned = false;
  const undo = Studio.button("undo", "Letzten Wischer zurücknehmen", () => {
    if (!history.length) return;
    ctx.putImageData(history.pop(), 0, 0);
    undo.disabled = !history.length;
    update();
  });
  undo.disabled = true;
  actions.append(
    undo,
    Studio.button("gallery", "Ein anderes Zauberbild", () => Gallery.open()),
    Studio.button("arrow", "Nächstes Zauberbild", () => Gallery.next()),
  );
  const dock = document.getElementById("water-tools"),
    sizes = document.createElement("div");
  sizes.className = "dock-group";
  [26, 48, 85].forEach((size, i) => {
    const b = Studio.button(
      "water",
      [
        "Kleiner Wassertropfen",
        "Mittlerer Wassertropfen",
        "Großer Wassertropfen",
      ][i],
      () => {
        radius = size;
        Studio.select(sizes, b);
      },
    );
    b.innerHTML = Icons("water");
    b.querySelector("svg").style.width = 22 + i * 8 + "px";
    b.querySelector("svg").style.height = 22 + i * 8 + "px";
    b.classList.toggle("on", i === 1);
    b.setAttribute("aria-pressed", String(i === 1));
    sizes.append(b);
  });
  function remember() {
    history.push(ctx.getImageData(0, 0, cover.width, cover.height));
    if (history.length > 6) history.shift();
    undo.disabled = false;
  }
  const reset = Studio.button("rotate", "Bild wieder zudecken", () => {
    if (!ready) return;
    remember();
    coverAll();
    update();
  });
  dock.append(sizes, reset);
  function coverAll() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#DFE8E3";
    ctx.fillRect(0, 0, cover.width, cover.height);
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.drawImage(under, 0, 0);
    ctx.restore();
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = i % 2 ? "#FFFFFF44" : "#B1C8BC22";
      ctx.fillRect(
        Math.random() * cover.width,
        Math.random() * cover.height,
        1.5,
        1.5,
      );
    }
    hint.classList.remove("hidden");
    changed = false;
  }
  function fit() {
    if (!under.width) return;
    const r = document.getElementById("water-stage").getBoundingClientRect(),
      s = Math.min(r.width / under.width, r.height / under.height);
    frame.style.width = under.width * s + "px";
    frame.style.height = under.height * s + "px";
  }
  async function load(item) {
    const token = ++version;
    ready = false;
    file = item.file;
    const image = new Image();
    image.src = file;
    try {
      await image.decode();
      if (token !== version) return;
      const scale = 1100 / Math.max(image.naturalWidth, image.naturalHeight);
      under.width = cover.width = Math.round(image.naturalWidth * scale);
      under.height = cover.height = Math.round(image.naturalHeight * scale);
      uctx.fillStyle = "#FFFEF9";
      uctx.fillRect(0, 0, under.width, under.height);
      uctx.drawImage(image, 0, 0, under.width, under.height);
      coverAll();
      if (restored?.file === file && restored.mask) {
        const mask = new Image();
        mask.src = restored.mask;
        await mask.decode();
        if (token !== version) return;
        ctx.clearRect(0, 0, cover.width, cover.height);
        ctx.drawImage(mask, 0, 0);
        changed = true;
      }
      restored = null;
      history = [];
      undo.disabled = true;
      ready = true;
      fit();
      update();
    } catch (_) {
      Studio.toast("Dieses Zauberbild konnte nicht geladen werden.");
    }
  }
  function point(e) {
    const r = cover.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * cover.width,
      y: ((e.clientY - r.top) / r.height) * cover.height,
    };
  }
  function dab(x, y) {
    const r = (radius * cover.width) / cover.getBoundingClientRect().width;
    ctx.globalCompositeOperation = "destination-out";
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "#000");
    g.addColorStop(0.72, "#000");
    g.addColorStop(1, "#0000");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function segment(a, b) {
    const distance = Math.hypot(a.x - b.x, a.y - b.y),
      steps = Math.max(1, Math.ceil(distance / 10));
    for (let i = 0; i <= steps; i++)
      dab(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
  }
  cover.addEventListener("pointerdown", (e) => {
    if (!ready || active !== null || e.button > 0) return;
    remember();
    active = e.pointerId;
    cover.setPointerCapture(active);
    last = point(e);
    dab(last.x, last.y);
    hint.classList.add("hidden");
    changed = true;
    e.preventDefault();
  });
  cover.addEventListener("pointermove", (e) => {
    if (e.pointerId !== active) return;
    const p = point(e);
    segment(last, p);
    last = p;
    e.preventDefault();
  });
  function end(e) {
    if (e.pointerId !== active) return;
    active = null;
    last = null;
    update();
  }
  cover.addEventListener("pointerup", end);
  cover.addEventListener("pointercancel", end);
  cover.addEventListener("lostpointercapture", end);
  function update() {
    const data = ctx.getImageData(0, 0, cover.width, cover.height).data;
    let revealed = 0,
      total = 0;
    for (let i = 3; i < data.length; i += 4 * 36) {
      total++;
      if (data[i] < 70) revealed++;
    }
    const fraction = revealed / total;
    const progress = document.getElementById("water-progress");
    progress.innerHTML = Array.from(
      { length: 5 },
      (_, i) =>
        `<span class="${fraction > i * 0.2 + 0.04 ? "complete" : ""}"></span>`,
    ).join("");
    progress.setAttribute(
      "aria-label",
      Math.round(fraction * 100) + " Prozent entdeckt",
    );
    hint.classList.toggle("hidden", fraction > 0.005 || changed);
    persist();
  }
  function persist() {
    if (!ready) return;
    const data = { file, mask: cover.toDataURL() };
    saveChain = saveChain
      .catch(() => {})
      .then(() => StudioStore.draft("water", data))
      .catch(() => {
        if (!warned) {
          Studio.toast("Der Entwurf kann hier nicht gespeichert werden.");
          warned = true;
        }
      });
  }
  document
    .querySelector(".home-button")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      if (active !== null) update();
      await saveChain;
      location.href = "index.html";
    });
  new ResizeObserver(fit).observe(document.getElementById("water-stage"));
  try {
    restored = await StudioStore.getDraft("water");
  } catch (_) {}
  Gallery.init({
    key: "water",
    withLevels: false,
    initialFile: restored?.file,
    onPick: load,
  });
})();
