(async function () {
  const { actions } = Studio.mount("stickers");
  const world = document.getElementById("sticker-world"),
    layer = document.getElementById("stickers-layer"),
    background = document.getElementById("world-background"),
    hint = document.getElementById("world-hint"),
    edit = document.getElementById("sticker-edit");
  const scenes = {
    garden: ["Wiese", "flower"],
    sea: ["Unterwasser", "whale"],
    space: ["Weltraum", "rocket"],
    town: ["Kleine Stadt", "house"],
  };
  const groups = {
    friends: [
      "Freunde",
      "cat",
      [
        "cat",
        "bunny",
        "bear",
        "fox",
        "frog",
        "turtle",
        "fish",
        "whale",
        "octopus",
        "butterfly",
      ],
    ],
    nature: [
      "Draußen",
      "flower",
      [
        "sun",
        "cloud",
        "rainbow",
        "flower",
        "tree",
        "mushroom",
        "butterfly",
        "moon",
      ],
    ],
    things: [
      "Unterwegs",
      "rocket",
      ["house", "car", "boat", "rocket", "planet", "ufo", "star", "balloon"],
    ],
  };
  let state = { scene: "garden", items: [] },
    selected = null,
    category = "friends",
    history = [],
    ready = false,
    saveChain = Promise.resolve(),
    warned = false;
  const copy = () => JSON.parse(JSON.stringify(state));
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
  const sceneButton = Studio.button("leaf", "Eine andere Welt", chooseScene);
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
      location.href = "index.html";
    });
  function chooseScene() {
    const choices = document.createElement("div");
    choices.className = "world-choices";
    Object.entries(scenes).forEach(([key, [name, icon]]) => {
      const b = document.createElement("button");
      b.className = "world-choice";
      b.innerHTML = Art.scene(key) + "<span>" + name + "</span>";
      b.setAttribute("aria-pressed", String(state.scene === key));
      b.addEventListener("click", () => {
        remember();
        state.scene = key;
        render();
        persist();
        dialog.close();
      });
      choices.append(b);
    });
    const dialog = Studio.modal("Wo spielt deine Geschichte?", choices);
  }
  function render() {
    background.innerHTML = Art.scene(state.scene);
    layer.innerHTML = "";
    hint.innerHTML = Art.svg(scenes[state.scene][1]) + Icons("plus");
    hint.hidden = state.items.length > 0;
    for (const item of state.items) {
      const b = document.createElement("button");
      b.className = "world-sticker";
      b.dataset.id = item.id;
      b.setAttribute("aria-label", Art.names[item.key] + " verschieben");
      b.innerHTML = Art.svg(item.key);
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
  function add(key, x = 50, y = 52) {
    if (state.items.length >= 80) {
      Studio.toast(
        "Deine Welt ist ganz voll. Verschiebe oder entferne einen Sticker.",
      );
      return;
    }
    remember();
    const id = Date.now() + "-" + Math.random().toString(36).slice(2);
    state.items.push({ id, key, x, y, size: 20, angle: 0, flip: false });
    selected = id;
    render();
    persist();
  }
  Object.entries(groups).forEach(([key, [name, icon]]) => {
    const b = document.createElement("button");
    b.className = "sticker-category";
    b.innerHTML = Art.svg(icon) + "<span>" + name + "</span>";
    b.setAttribute("aria-label", name);
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
    groups[category][2].forEach((key) => {
      const b = document.createElement("button");
      b.className = "sticker-piece";
      b.innerHTML = Art.svg(key);
      b.setAttribute("aria-label", Art.names[key] + " hinzufügen");
      tray.append(b);
      let ghost;
      PlayDrag(b, {
        disabled: () => !ready,
        start(e) {
          ghost = document.createElement("div");
          ghost.className = "sticker-ghost";
          ghost.innerHTML = Art.svg(key);
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
              key,
              ((e.clientX - r.left) / r.width) * 100,
              ((e.clientY - r.top) / r.height) * 100,
            );
        },
        tap() {
          add(key, 45 + Math.random() * 10, 45 + Math.random() * 10);
        },
      });
    });
  }
  world.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".world-sticker")) return;
    selected = null;
    updateSelection();
  });
  async function saveWorld() {
    save.disabled = true;
    try {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">${Art.backgrounds[state.scene]}${state.items.map((i) => `<g transform="translate(${i.x * 12} ${i.y * 8}) rotate(${i.angle}) scale(${i.flip ? -1 : 1} 1)">${Art.place(i.key, -i.size * 6, -i.size * 6, i.size * 12)}</g>`).join("")}</svg>`;
      const im = new Image();
      const url = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml" }),
      );
      try {
        im.src = url;
        await im.decode();
        const c = document.createElement("canvas");
        c.width = 1200;
        c.height = 800;
        c.getContext("2d").drawImage(im, 0, 0, 1200, 800);
        await Studio.save(c, "stickers", copy());
      } finally {
        URL.revokeObjectURL(url);
      }
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
    if (data && scenes[data.scene] && Array.isArray(data.items)) state = data;
  } catch (_) {}
  ready = true;
  render();
  renderTray();
})();
