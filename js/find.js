/* Suchspaß as a hidden-picture game (owner chose option A, 2026-11-24): five
   figures hide behind things in a busy world, a strip shows all five, and the
   child finds them in any order. Pictures come from templates/manifest.json:
   "find" (worlds), "findSprites" (figures) and "findProps" (things to hide
   behind); a figure or prop belongs to the world named in its "theme". */
(async function () {
  const { actions } = Studio.mount("find");
  const board = document.getElementById("find-world"),
    strip = document.getElementById("find-progress"),
    finished = document.getElementById("find-finished");
  const HIDDEN = 5,
    DECOYS = 2;
  let worlds = [],
    sprites = {},
    props = {},
    names = {};
  try {
    const manifest = await (await fetch("templates/manifest.json")).json();
    const id = (file) => file.split("/").pop().replace(/\.\w+$/, "");
    worlds = (manifest.find || [])
      .filter((it) => !it.retired)
      .map((it) => ({ ...it, id: id(it.file) }));
    for (const it of manifest.findSprites || []) {
      (sprites[it.theme] ||= []).push(it.file);
      names[it.file] = it.name;
    }
    for (const it of manifest.findProps || [])
      (props[it.theme] ||= []).push(it.file);
    worlds = worlds.filter(
      (w) => sprites[w.id]?.length >= HIDDEN && props[w.id]?.length,
    );
  } catch (_) {}
  if (!worlds.length) {
    Studio.toast(
      "Die Bilder konnten nicht geladen werden. Öffne das Atelier einmal mit Internet.",
    );
    return;
  }
  let state = null;
  const hint = Studio.button("search", "Zeig mir einen kleinen Hinweis", () => {
    const hide = board.querySelector(".seek-hide:has(.seek-friend:not(.found))");
    if (!hide) return;
    hide.classList.remove("seek-hint");
    void hide.offsetWidth;
    hide.classList.add("seek-hint");
  });
  actions.append(
    hint,
    Studio.button("rotate", "Eine neue Suchrunde", () => newRound()),
    Studio.button("gallery", "Eine andere Welt", chooseWorld),
  );
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function persist() {
    StudioStore.draft("find", state).catch(() => {});
  }
  // Hiding places stand on the open ground in the lower part of the picture.
  // Places further down are nearer, so they are drawn bigger and in front.
  function places(count) {
    const made = [];
    for (let tries = 0; made.length < count && tries < 400; tries++) {
      const x = 9 + Math.random() * 82,
        y = 60 + Math.random() * 34;
      if (made.every((p) => Math.hypot((p.x - x) / 17, (p.y - y) / 15) > 1))
        made.push({ x, y, size: 13 + ((y - 60) / 34) * 6 });
    }
    return made;
  }
  function newRound(world = state?.world || worlds[0].id) {
    const figures = shuffle([...sprites[world]]).slice(0, HIDDEN);
    const spots = places(HIDDEN + DECOYS);
    state = {
      world,
      hides: spots.map((spot, i) => ({
        ...spot,
        prop: props[world][Math.floor(Math.random() * props[world].length)],
        figure: figures[i] || null,
        peek: ["up", "up", "left", "right"][Math.floor(Math.random() * 4)],
        flip: Math.random() < 0.5,
      })),
      found: [],
    };
    render();
    persist();
  }
  function render() {
    const world = worlds.find((w) => w.id === state.world) || worlds[0];
    board.className = "";
    board.innerHTML = `<img class="seek-scene" src="${world.file}" alt="" draggable="false" />`;
    [...state.hides]
      .sort((a, b) => a.y - b.y)
      .forEach((hide) => {
        const box = document.createElement("div");
        box.className = "seek-hide";
        box.style.left = hide.x + "%";
        box.style.top = hide.y + "%";
        box.style.width = hide.size + "%";
        box.style.zIndex = Math.round(hide.y);
        if (hide.figure) {
          const b = document.createElement("button");
          b.className = "seek-friend peek-" + hide.peek;
          b.dataset.friend = hide.figure;
          b.setAttribute("aria-label", names[hide.figure] || "Versteckte Figur");
          b.innerHTML = `<img src="${hide.figure}" alt="" draggable="false" />`;
          b.addEventListener("click", () => tap(hide.figure));
          box.append(b);
        }
        const prop = document.createElement("img");
        prop.className = "seek-prop" + (hide.flip ? " flip" : "");
        prop.src = hide.prop;
        prop.alt = "";
        prop.draggable = false;
        box.append(prop);
        board.append(box);
      });
    strip.innerHTML = "";
    state.hides
      .filter((hide) => hide.figure)
      .forEach((hide) => {
        const chip = document.createElement("span");
        chip.className = "seek-chip";
        chip.dataset.friend = hide.figure;
        chip.innerHTML = `<img src="${hide.figure}" alt="" draggable="false" />`;
        strip.append(chip);
      });
    update();
  }
  function update() {
    const left = state.hides.filter(
      (hide) => hide.figure && !state.found.includes(hide.figure),
    ).length;
    board.querySelectorAll(".seek-friend").forEach((b) => {
      const found = state.found.includes(b.dataset.friend);
      b.classList.toggle("found", found);
      // Not `disabled`: a disabled button is drawn pale, and the figure stays on show.
      b.setAttribute("aria-pressed", String(found));
    });
    strip.querySelectorAll(".seek-chip").forEach((chip) => {
      chip.classList.toggle(
        "complete",
        state.found.includes(chip.dataset.friend),
      );
    });
    strip.setAttribute(
      "aria-label",
      `${HIDDEN - left} von ${HIDDEN} Figuren gefunden`,
    );
    hint.disabled = !left;
    // The natural ending: everyone comes out and hops. Nothing starts by itself.
    board.classList.toggle("all-found", !left);
    finished.hidden = !!left;
  }
  function tap(figure) {
    if (state.found.includes(figure)) return;
    state.found.push(figure);
    persist();
    update();
  }
  function chooseWorld() {
    const choices = document.createElement("div");
    choices.className = "world-choices";
    worlds.forEach((world) => {
      const b = document.createElement("button");
      b.className = "world-choice";
      b.innerHTML = `<img src="${world.file}" alt="" draggable="false" />`;
      b.setAttribute("aria-label", world.name);
      b.setAttribute("aria-pressed", String(state.world === world.id));
      b.addEventListener("click", () => {
        newRound(world.id);
        dialog.close();
      });
      choices.append(b);
    });
    const dialog = Studio.modal("Wo möchtest du suchen?", choices);
  }
  function fit() {
    const r = document.getElementById("find-stage").getBoundingClientRect(),
      w = Math.min(r.width, r.height * 1.5);
    board.style.width = w + "px";
    board.style.height = w / 1.5 + "px";
  }
  new ResizeObserver(fit).observe(document.getElementById("find-stage"));
  try {
    const data = await StudioStore.getDraft("find");
    // A round saved by the earlier version (drawn figures) is not continued.
    if (
      data &&
      worlds.some((w) => w.id === data.world) &&
      Array.isArray(data.hides) &&
      Array.isArray(data.found) &&
      data.hides.every(
        (h) =>
          props[data.world].includes(h.prop) &&
          (!h.figure || sprites[data.world].includes(h.figure)),
      )
    )
      state = data;
  } catch (_) {}
  if (state) render();
  else newRound();
  fit();
})();
