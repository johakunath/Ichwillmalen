(async function () {
  const { actions } = Studio.mount("stickers");
  const world = document.getElementById("sticker-world"),
    layer = document.getElementById("stickers-layer"),
    background = document.getElementById("world-background"),
    hint = document.getElementById("world-hint"),
    edit = document.getElementById("sticker-edit");
  // Worlds and figures drawn in code (js/art.js) are no longer offered, but a
  // saved world or album picture made with them must still open and save.
  const oldScenes = { garden: 1, sea: 1, space: 1, town: 1 };
  // Sticker pictures come from templates/manifest.json: "stickers" (cut-outs,
  // grouped by theme) and "stages" (backgrounds).
  const groupOf = {
    dinos: "dinos",
    vehicles: "vehicles",
    bricks: "bricks",
    people: "more",
    nature: "more",
    everyday: "more",
  };
  const groupNames = {
    dinos: "Dinos",
    vehicles: "Fahrzeuge",
    bricks: "Bausteine",
    more: "Leute und Sachen",
  };
  let stickers = [],
    stages = [],
    names = {};
  try {
    const response = await fetch("templates/manifest.json");
    const manifest = await response.json();
    stickers = (manifest.stickers || []).filter((it) => !it.retired);
    stages = (manifest.stages || []).filter((it) => !it.retired);
    for (const it of manifest.stickers || []) names[it.file] = it.name;
  } catch (_) {
    Studio.toast(
      "Die Sticker konnten nicht geladen werden. Öffne das Atelier einmal mit Internet.",
    );
  }
  const groups = {};
  for (const it of stickers)
    (groups[groupOf[it.theme] || "more"] ||= []).push(it);
  let state = { scene: stages[0]?.file || "garden", items: [] },
    selected = null,
    category = Object.keys(groupNames).find((key) => groups[key]) || "dinos",
    history = [],
    ready = false,
    saveChain = Promise.resolve(),
    warned = false;
  const copy = () => JSON.parse(JSON.stringify(state));
  const isStage = (scene) =>
    typeof scene === "string" && /^templates\/stages\/[\w-]+\.webp$/.test(scene);
  const isSticker = (file) =>
    typeof file === "string" && /^templates\/stickers\/[\w-]+\.webp$/.test(file);
  const itemName = (item) =>
    item.file ? names[item.file] || "Sticker" : Art.names[item.key];
  const itemMarkup = (item) =>
    item.file
      ? `<img src="${item.file}" alt="" draggable="false" />`
      : Art.svg(item.key);
  function fitWorld() {
    const bounds = document
      .getElementById("sticker-stage")
      .getBoundingClientRect();
    const width = Math.min(bounds.width, bounds.height * 1.5);
    world.style.width = width + "px";
    world.style.height = width / 1.5 + "px";
  }
  new ResizeObserver(fitWorld).observe(
    document.getElementById("sticker-stage"),
  );
  const undo = Studio.button("undo", "Letzte Änderung zurücknehmen", () => {
    if (!history.length) return;
    state = history.pop();
    selected = null;
    render();
    persist();
  });
  const save = Studio.button("save", "Klebewelt speichern", saveWorld);
  save.dataset.save = "";
  const sceneButton = Studio.button("gallery", "Eine andere Welt", chooseScene);
  actions.append(undo, save, sceneButton);
  function remember() {
    history.push(copy());
    if (history.length > 30) history.shift();
    undo.disabled = false;
  }
  function persist() {
    if (!ready) return;
    const data = copy();
    saveChain = saveChain
      .catch(() => {})
      .then(() => StudioStore.draft("stickers", data))
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
      Tablet.go("index.html");
    });
  function chooseScene() {
    const choices = document.createElement("div");
    choices.className = "world-choices";
    stages.forEach((stage) => {
      const b = document.createElement("button");
      b.className = "world-choice";
      b.innerHTML = `<img src="${stage.file}" alt="" draggable="false" />`;
      b.setAttribute("aria-label", stage.name);
      b.setAttribute("aria-pressed", String(state.scene === stage.file));
      b.addEventListener("click", () => {
        remember();
        state.scene = stage.file;
        render();
        persist();
        dialog.close();
      });
      choices.append(b);
    });
    const dialog = Studio.modal("Wo spielt deine Geschichte?", choices);
  }
  function render() {
    background.innerHTML = isStage(state.scene)
      ? `<img src="${state.scene}" alt="" draggable="false" />`
      : Art.scene(state.scene);
    layer.innerHTML = "";
    hint.innerHTML =
      (stickers[0] ? itemMarkup({ file: stickers[0].file }) : "") +
      Icons("plus");
    hint.hidden = state.items.length > 0;
    for (const item of state.items) {
      const b = document.createElement("button");
      b.className = "world-sticker";
      b.dataset.id = item.id;
      b.setAttribute("aria-label", itemName(item) + " verschieben");
      b.innerHTML = itemMarkup(item);
      position(b, item);
      layer.append(b);
      let before = null;
      PlayDrag(b, {
        start() {
          remember();
          before = { x: item.x, y: item.y };
          selected = item.id;
          updateSelection();
          b.classList.add("dragging");
        },
        move(e, delta) {
          const r = world.getBoundingClientRect();
          item.x = Math.max(
            4,
            Math.min(96, before.x + (delta.x / r.width) * 100),
          );
          item.y = Math.max(
            5,
            Math.min(95, before.y + (delta.y / r.height) * 100),
          );
          position(b, item);
        },
        end(e, cancelled) {
          if (cancelled) {
            item.x = before.x;
            item.y = before.y;
            history.pop();
          }
          b.classList.remove("dragging");
          position(b, item);
          persist();
        },
        tap() {
          selected = selected === item.id ? null : item.id;
          updateSelection();
        },
      });
      b.addEventListener("keydown", (e) => {
        const d = {
          ArrowLeft: [-2, 0],
          ArrowRight: [2, 0],
          ArrowUp: [0, -2],
          ArrowDown: [0, 2],
        }[e.key];
        if (!d) return;
        e.preventDefault();
        remember();
        item.x = Math.max(4, Math.min(96, item.x + d[0]));
        item.y = Math.max(5, Math.min(95, item.y + d[1]));
        position(b, item);
        persist();
      });
    }
    undo.disabled = !history.length;
    updateSelection();
  }
  function position(b, item) {
    b.style.left = item.x + "%";
    b.style.top = item.y + "%";
    b.style.width = item.size + "%";
    b.style.transform = `translate(-50%,-50%) rotate(${item.angle}deg) scaleX(${item.flip ? -1 : 1})`;
  }
  function updateSelection() {
    layer.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.id === selected);
      b.setAttribute("aria-pressed", String(b.dataset.id === selected));
    });
    edit.hidden = !selected;
  }
  function modify(fn) {
    const item = state.items.find((i) => i.id === selected);
    if (!item) return;
    remember();
    fn(item);
    render();
    persist();
  }
  edit.append(
    Studio.button("minus", "Sticker kleiner", () =>
      modify((i) => (i.size = Math.max(12, i.size - 3))),
    ),
    Studio.button("plus", "Sticker größer", () =>
      modify((i) => (i.size = Math.min(42, i.size + 3))),
    ),
    Studio.button("rotate", "Sticker drehen", () =>
      modify((i) => (i.angle = (i.angle + 20) % 360)),
    ),
    Studio.button("flip", "Sticker spiegeln", () =>
      modify((i) => (i.flip = !i.flip)),
    ),
    Studio.button("trash", "Diesen Sticker entfernen", () => {
      remember();
      state.items = state.items.filter((i) => i.id !== selected);
      selected = null;
      render();
      persist();
    }),
    Studio.button("check", "Sticker fertig", () => {
      selected = null;
      updateSelection();
    }),
  );
  function add(file, x = 50, y = 52) {
    if (state.items.length >= 80) {
      Studio.toast(
        "Deine Welt ist ganz voll. Verschiebe oder entferne einen Sticker.",
      );
      return;
    }
    remember();
    const id = Date.now() + "-" + Math.random().toString(36).slice(2);
    state.items.push({ id, file, x, y, size: 22, angle: 0, flip: false });
    selected = id;
    render();
    persist();
  }
  Object.keys(groupNames).forEach((key) => {
    if (!groups[key]) return;
    const b = document.createElement("button");
    b.className = "sticker-category";
    b.innerHTML = itemMarkup({ file: groups[key][0].file });
    b.setAttribute("aria-label", groupNames[key]);
    b.title = groupNames[key];
    b.dataset.category = key;
    b.addEventListener("click", () => {
      category = key;
      renderTray();
    });
    document.getElementById("sticker-categories").append(b);
  });
  function renderTray() {
    document.querySelectorAll(".sticker-category").forEach((b) => {
      b.classList.toggle("on", b.dataset.category === category);
      b.setAttribute("aria-pressed", String(b.dataset.category === category));
    });
    const tray = document.getElementById("sticker-pieces");
    tray.innerHTML = "";
    tray.scrollTop = tray.scrollLeft = 0;
    (groups[category] || []).forEach((sticker) => {
      const b = document.createElement("button");
      b.className = "sticker-piece";
      b.innerHTML = itemMarkup(sticker);
      b.setAttribute("aria-label", sticker.name + " hinzufügen");
      tray.append(b);
      let ghost;
      PlayDrag(b, {
        disabled: () => !ready,
        start(e) {
          ghost = document.createElement("div");
          ghost.className = "sticker-ghost";
          ghost.innerHTML = itemMarkup(sticker);
          document.body.append(ghost);
        },
        move(e) {
          ghost.style.left = e.clientX + "px";
          ghost.style.top = e.clientY + "px";
        },
        end(e, cancelled) {
          ghost?.remove();
          const r = world.getBoundingClientRect();
          if (
            !cancelled &&
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          )
            add(
              sticker.file,
              ((e.clientX - r.left) / r.width) * 100,
              ((e.clientY - r.top) / r.height) * 100,
            );
        },
        tap() {
          add(sticker.file, 40 + Math.random() * 20, 55 + Math.random() * 15);
        },
      });
    });
  }
  world.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".world-sticker")) return;
    selected = null;
    updateSelection();
  });
  // The saved picture is painted on a canvas: the background first, then every
  // sticker with its position, size, turn and mirror, as on the screen.
  function picture(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }
  async function svgPicture(inner, viewBox, width, height) {
    const url = URL.createObjectURL(
      new Blob(
        [
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${inner}</svg>`,
        ],
        { type: "image/svg+xml" },
      ),
    );
    try {
      return await picture(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function saveWorld() {
    save.disabled = true;
    try {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 800;
      const ctx = c.getContext("2d");
      ctx.drawImage(
        isStage(state.scene)
          ? await picture(state.scene)
          : await svgPicture(
              Art.backgrounds[state.scene],
              "0 0 1200 800",
              1200,
              800,
            ),
        0,
        0,
        1200,
        800,
      );
      for (const item of state.items) {
        const box = item.size * 12;
        const image = item.file
          ? await picture(item.file)
          : await svgPicture(Art.place(item.key, 0, 0, 100), "0 0 100 100", box, box);
        const scale = Math.min(box / image.width, box / image.height);
        ctx.save();
        ctx.translate(item.x * 12, item.y * 8);
        ctx.rotate((item.angle * Math.PI) / 180);
        ctx.scale(item.flip ? -1 : 1, 1);
        ctx.drawImage(
          image,
          (-image.width * scale) / 2,
          (-image.height * scale) / 2,
          image.width * scale,
          image.height * scale,
        );
        ctx.restore();
      }
      await Studio.save(c, "stickers", copy());
    } catch (_) {
      Studio.toast("Das Bild konnte gerade nicht gespeichert werden.");
    } finally {
      save.disabled = false;
    }
  }
  try {
    const id = new URLSearchParams(location.search).get("art");
    const data = id
      ? (await StudioStore.get(id))?.data
      : await StudioStore.getDraft("stickers");
    if (
      data &&
      (oldScenes[data.scene] || isStage(data.scene)) &&
      Array.isArray(data.items) &&
      data.items.every((i) =>
        i.file ? isSticker(i.file) : typeof i.key === "string",
      )
    )
      state = data;
  } catch (_) {}
  ready = true;
  render();
  renderTray();
})();
