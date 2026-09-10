(async function () {
  const { actions } = Studio.mount("find");
  const board = document.getElementById("find-world"),
    quest = document.getElementById("find-target"),
    progress = document.getElementById("find-progress");
  const pools = {
    garden: [
      "cat",
      "bunny",
      "bear",
      "fox",
      "frog",
      "turtle",
      "flower",
      "mushroom",
      "butterfly",
      "balloon",
      "sun",
      "rainbow",
    ],
    sea: [
      "fish",
      "whale",
      "octopus",
      "turtle",
      "boat",
      "star",
      "sun",
      "cloud",
      "balloon",
      "frog",
    ],
    space: [
      "rocket",
      "planet",
      "ufo",
      "star",
      "moon",
      "sun",
      "bear",
      "cat",
      "bunny",
      "balloon",
    ],
    town: [
      "house",
      "car",
      "boat",
      "tree",
      "cat",
      "bunny",
      "bear",
      "flower",
      "balloon",
      "sun",
      "cloud",
      "fox",
    ],
  };
  let state = { scene: "garden", items: [], targets: [], found: [] },
    busy = false,
    timer;
  const hint = Studio.button("search", "Zeig mir einen kleinen Hinweis", () => {
    board
      .querySelector(`[data-friend="${current()}"]`)
      ?.classList.add("find-hint");
  });
  actions.append(
    hint,
    Studio.button("rotate", "Eine neue Suchrunde", () => newRound()),
  );
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function current() {
    return state.targets.find((key) => !state.found.includes(key));
  }
  function persist() {
    StudioStore.draft("find", state).catch(() => {});
  }
  function newRound(scene = state.scene) {
    clearTimeout(timer);
    busy = false;
    const keys = shuffle([...pools[scene]]).slice(0, 8);
    const spots = shuffle(
      Array.from({ length: 8 }, (_, i) => ({
        x: 14 + (i % 4) * 24,
        y: 30 + Math.floor(i / 4) * 40,
      })),
    );
    state = {
      scene,
      items: keys.map((key, i) => ({
        key,
        x: spots[i].x + (Math.random() - 0.5) * 4,
        y: spots[i].y + (Math.random() - 0.5) * 7,
        angle: (Math.random() - 0.5) * 18,
      })),
      targets: shuffle([...keys]).slice(0, 4),
      found: [],
    };
    render();
    persist();
  }
  function render() {
    board.innerHTML = Art.scene(state.scene);
    state.items.forEach((item) => {
      const b = document.createElement("button");
      b.className = "find-friend";
      b.dataset.friend = item.key;
      b.style.left = item.x + "%";
      b.style.top = item.y + "%";
      b.style.rotate = item.angle + "deg";
      b.innerHTML = Art.svg(item.key);
      b.setAttribute("aria-label", Art.names[item.key]);
      b.addEventListener("click", () => tap(item.key, b));
      board.append(b);
    });
    update();
  }
  function update() {
    const target = current();
    quest.innerHTML = target
      ? "<span>Findest du mich?</span>" + Art.svg(target)
      : Icons("check");
    quest.setAttribute(
      "aria-label",
      target ? "Finde " + Art.names[target] : "Alle vier Freunde gefunden",
    );
    hint.disabled = !target;
    board.querySelectorAll(".find-friend").forEach((b) => {
      const found = state.found.includes(b.dataset.friend);
      b.classList.toggle("found", found);
      b.disabled = found;
      if (found && !b.querySelector(".found-check")) {
        const check = document.createElement("span");
        check.className = "found-check";
        check.innerHTML = Icons("check");
        b.append(check);
      }
    });
    progress.innerHTML = "";
    state.targets.forEach((key, i) => {
      const dot = document.createElement("span");
      dot.className =
        "find-dot" + (state.found.includes(key) ? " complete" : "");
      dot.innerHTML = state.found.includes(key) ? Art.svg(key) : "<i></i>";
      progress.append(dot);
    });
    document.getElementById("find-finished").hidden = !!target;
  }
  function tap(key, button) {
    if (busy || !current()) return;
    if (key === current()) {
      busy = true;
      state.found.push(key);
      button.classList.add("found");
      const check = document.createElement("span");
      check.className = "found-check";
      check.innerHTML = Icons("check");
      button.append(check);
      persist();
      timer = setTimeout(() => {
        busy = false;
        update();
      }, 550);
    } else {
      button.classList.remove("soft-wobble");
      void button.offsetWidth;
      button.classList.add("soft-wobble");
    }
  }
  const sceneKeys = Object.keys(pools);
  document.getElementById("find-next").innerHTML = Icons("arrow");
  document.getElementById("find-again").innerHTML = Icons("rotate");
  document
    .getElementById("find-next")
    .addEventListener("click", () =>
      newRound(
        sceneKeys[(sceneKeys.indexOf(state.scene) + 1) % sceneKeys.length],
      ),
    );
  document
    .getElementById("find-again")
    .addEventListener("click", () => newRound());
  function fit() {
    const r = document.getElementById("find-stage").getBoundingClientRect(),
      w = Math.min(r.width, r.height * 1.5);
    board.style.width = w + "px";
    board.style.height = w / 1.5 + "px";
  }
  new ResizeObserver(fit).observe(document.getElementById("find-stage"));
  try {
    const data = await StudioStore.getDraft("find");
    if (
      data &&
      pools[data.scene] &&
      data.items?.length === 8 &&
      data.targets?.length === 4
    )
      state = data;
  } catch (_) {}
  if (state.items.length) render();
  else newRound();
  fit();
})();
