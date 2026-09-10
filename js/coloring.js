(async function () {
  const { actions } = Studio.mount("coloring");
  const canvas = document.getElementById("art"),
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  let source = null,
    boundary = null,
    color = THEME.palette[1],
    history = [],
    file = "",
    version = 0,
    restored = null,
    ready = false,
    saveChain = Promise.resolve(),
    warned = false;
  const undo = Studio.button("undo", "Letzte Farbe zurücknehmen", () => {
    if (!history.length) return;
    ctx.putImageData(history.pop(), 0, 0);
    undo.disabled = !history.length;
    persist();
  });
  undo.disabled = true;
  const save = Studio.button("save", "Bild in Meine Bilder speichern", () =>
    Studio.save(canvas, "coloring", { file, image: canvas.toDataURL() }),
  );
  save.dataset.save = "";
  actions.append(
    undo,
    save,
    Studio.button("new", "Bild neu ausmalen", () =>
      Studio.confirmNew(() => {
        remember();
        ctx.putImageData(source, 0, 0);
        persist();
      }),
    ),
  );
  const colors = document.getElementById("color-paints");
  Studio.colors(colors, (c) => (color = c), color);
  document
    .getElementById("color-pictures")
    .append(Studio.button("gallery", "Ein anderes Bild", () => Gallery.open()));
  function remember() {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 6) history.shift();
    undo.disabled = false;
  }
  function persist() {
    if (!ready) return;
    const data = { file, image: canvas.toDataURL() };
    saveChain = saveChain
      .catch(() => {})
      .then(() => StudioStore.draft("coloring", data))
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
      await saveChain;
      location.href = "index.html";
    });
  function fit() {
    if (!canvas.width) return;
    const r = document.getElementById("color-stage").getBoundingClientRect(),
      scale = Math.min(r.width / canvas.width, r.height / canvas.height);
    canvas.style.width = canvas.width * scale + "px";
    canvas.style.height = canvas.height * scale + "px";
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
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      source = ctx.getImageData(0, 0, canvas.width, canvas.height);
      boundary = FloodFill.mask(source);
      history = [];
      undo.disabled = true;
      if (restored?.file === file && restored.image) {
        const drawing = new Image();
        drawing.src = restored.image;
        await drawing.decode();
        if (token !== version) return;
        ctx.drawImage(drawing, 0, 0, canvas.width, canvas.height);
      }
      restored = null;
      ready = true;
      fit();
      persist();
    } catch (_) {
      Studio.toast(
        "Dieses Bild konnte nicht geladen werden. Wähle ein anderes.",
      );
    }
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (!ready || e.button > 0) return;
    const r = canvas.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width) * canvas.width,
      y = ((e.clientY - r.top) / r.height) * canvas.height;
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height),
      before = new ImageData(
        new Uint8ClampedArray(image.data),
        canvas.width,
        canvas.height,
      ),
      rgb = color.match(/\w\w/g).map((x) => parseInt(x, 16));
    const count = FloodFill.fill(image, boundary, x, y, rgb);
    if (count) {
      history.push(before);
      if (history.length > 6) history.shift();
      undo.disabled = false;
      ctx.putImageData(image, 0, 0);
      persist();
    }
    e.preventDefault();
  });
  new ResizeObserver(fit).observe(document.getElementById("color-stage"));
  try {
    const id = new URLSearchParams(location.search).get("art");
    restored = id
      ? (await StudioStore.get(id))?.data
      : await StudioStore.getDraft("coloring");
  } catch (_) {}
  Gallery.init({
    key: "coloring",
    withLevels: true,
    initialFile: restored?.file,
    defaultFile: "templates/coloring/fish.svg",
    onPick: load,
  });
})();
