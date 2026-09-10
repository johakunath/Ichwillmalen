(async function () {
  const { actions } = Studio.mount("puzzle");
  const board = document.getElementById("puzzle-board"),
    tray = document.getElementById("puzzle-tray"),
    footer = document.getElementById("puzzle-footer"),
    progress = document.getElementById("puzzle-progress");
  let list = [],
    file = "templates/water/garden-kitten.webp",
    columns = 2,
    rows = 2,
    placed = [],
    image = null,
    chosen = null,
    order = [],
    loading = 0,
    ghost = null,
    dragId = null,
    ready = false;
  const layouts = [
    [2, 2],
    [3, 2],
    [3, 3],
  ];
  actions.append(
    Studio.button("gallery", "Ein anderes Puzzlebild", choosePicture),
    Studio.button("grid", "Anzahl der Puzzleteile", chooseSize),
    Studio.button("arrow", "Nächstes Puzzle", next),
  );
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function persist() {
    if (ready)
      StudioStore.draft("puzzle", { file, columns, rows, placed }).catch(
        () => {},
      );
  }
  async function load(reset = true) {
    const request = ++loading;
    ready = false;
    chosen = null;
    ghost?.remove();
    ghost = null;
    dragId = null;
    if (reset) placed = [];
    const im = new Image();
    im.src = file;
    try {
      await im.decode();
      if (request !== loading) return;
      image = im;
      order = shuffle(Array.from({ length: columns * rows }, (_, i) => i));
      ready = true;
      render();
      persist();
    } catch (_) {
      if (request === loading) {
        Studio.toast("Dieses Bild lädt gerade nicht. Wähle ein anderes Bild.");
      }
    }
  }
  function render() {
    board.innerHTML = "";
    tray.innerHTML = "";
    progress.innerHTML = "";
    document.querySelector(".puzzle-finished")?.remove();
    progress.hidden = false;
    const guide = new Image();
    guide.src = file;
    guide.className = "puzzle-guide";
    guide.alt = "So sieht dein fertiges Puzzle aus";
    board.append(guide);
    for (let i = 0; i < columns * rows; i++) {
      const slot = document.createElement("button");
      slot.className = "puzzle-slot";
      slot.dataset.slot = i;
      slot.setAttribute("aria-label", `Platz ${i + 1}`);
      slot.style.left = ((i % columns) / columns) * 100 + "%";
      slot.style.top = (Math.floor(i / columns) / rows) * 100 + "%";
      slot.style.width = 100 / columns + "%";
      slot.style.height = 100 / rows + "%";
      slot.addEventListener("click", () => {
        if (chosen === i) place(i);
        else if (chosen !== null) showHint(chosen);
      });
      board.append(slot);
      const dot = document.createElement("span");
      dot.classList.toggle("complete", placed.includes(i));
      progress.append(dot);
    }
    order.forEach((i) => {
      const piece = document.createElement("button");
      piece.className = "puzzle-piece";
      piece.dataset.piece = i;
      piece.setAttribute("aria-label", `Puzzleteil ${i + 1}`);
      piece.style.backgroundImage = `url("${file}")`;
      piece.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
      piece.style.backgroundPosition = `${((i % columns) / (columns - 1)) * 100}% ${(Math.floor(i / columns) / (rows - 1)) * 100}%`;
      if (placed.includes(i)) {
        putOnBoard(piece, i);
      } else {
        tray.append(piece);
        PlayDrag(piece, {
          disabled: () => !ready,
          start(e) {
            chosen = i;
            dragId = i;
            updateChoice();
            ghost = piece.cloneNode(true);
            ghost.removeAttribute("data-piece");
            ghost.setAttribute("aria-hidden", "true");
            ghost.className = "puzzle-piece moving";
            const r = board.getBoundingClientRect();
            ghost.style.width = r.width / columns + "px";
            ghost.style.height = r.height / rows + "px";
            ghost.style.left = e.clientX - r.width / columns / 2 + "px";
            ghost.style.top = e.clientY - r.height / rows / 2 + "px";
            document.body.append(ghost);
            piece.classList.add("piece-space");
          },
          move(e) {
            if (!ghost) return;
            ghost.style.left = e.clientX - ghost.offsetWidth / 2 + "px";
            ghost.style.top = e.clientY - ghost.offsetHeight / 2 + "px";
          },
          end(e, cancelled) {
            ghost?.remove();
            ghost = null;
            dragId = null;
            piece.classList.remove("piece-space");
            if (cancelled) {
              chosen = null;
              updateChoice();
              return;
            }
            const slot = board
              .querySelector(`[data-slot="${i}"]`)
              .getBoundingClientRect();
            const tolerance = Math.min(slot.width, slot.height) * 0.18;
            if (
              e.clientX >= slot.left - tolerance &&
              e.clientX <= slot.right + tolerance &&
              e.clientY >= slot.top - tolerance &&
              e.clientY <= slot.bottom + tolerance
            )
              place(i);
            else showHint(i);
          },
          tap() {
            chosen = chosen === i ? null : i;
            updateChoice();
            if (chosen !== null) showHint(i);
          },
        });
      }
    });
    layout();
    updateChoice();
    if (placed.length === columns * rows) finish();
  }
  function putOnBoard(piece, i) {
    piece.classList.add("placed");
    piece.disabled = true;
    piece.style.left = ((i % columns) / columns) * 100 + "%";
    piece.style.top = (Math.floor(i / columns) / rows) * 100 + "%";
    piece.style.width = 100 / columns + "%";
    piece.style.height = 100 / rows + "%";
    board.append(piece);
    const slot = board.querySelector(`[data-slot="${i}"]`);
    slot.classList.add("filled");
    slot.disabled = true;
  }
  function place(i) {
    if (placed.includes(i) || !ready) return;
    placed.push(i);
    const piece = tray.querySelector(`[data-piece="${i}"]`);
    putOnBoard(piece, i);
    chosen = null;
    updateChoice();
    progress.children[i].classList.add("complete");
    progress.setAttribute(
      "aria-label",
      `${placed.length} von ${columns * rows} Teilen passen`,
    );
    persist();
    if (placed.length === columns * rows) finish();
  }
  function updateChoice() {
    tray.querySelectorAll(".puzzle-piece").forEach((p) => {
      p.classList.toggle("chosen", Number(p.dataset.piece) === chosen);
      p.setAttribute(
        "aria-pressed",
        String(Number(p.dataset.piece) === chosen),
      );
    });
    board
      .querySelectorAll(".puzzle-slot")
      .forEach((s) => s.classList.remove("hint"));
  }
  function showHint(i) {
    board
      .querySelectorAll(".puzzle-slot")
      .forEach((s) => s.classList.toggle("hint", Number(s.dataset.slot) === i));
  }
  function finish() {
    progress.hidden = true;
    const message = document.createElement("div");
    message.className = "puzzle-finished";
    message.innerHTML = Icons("check") + "Dein Bild ist fertig.";
    message.setAttribute("role", "status");
    const again = Studio.button("rotate", "Dieses Puzzle nochmal", () =>
      load(),
    );
    const nextButton = Studio.button("arrow", "Nächstes Puzzle", next);
    message.append(again, nextButton);
    footer.append(message);
  }
  function next() {
    if (!list.length) return;
    const current = list.findIndex((it) => it.file === file);
    file = list[(current + 1) % list.length].file;
    load();
  }
  function chooseSize() {
    const content = document.createElement("div");
    content.className = "puzzle-options";
    layouts.forEach(([c, r]) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `${c * r} Teile`);
      b.setAttribute("aria-pressed", String(c === columns && r === rows));
      b.innerHTML = `<span class="mini-grid" style="grid-template-columns:repeat(${c},1fr)">${"<i></i>".repeat(c * r)}</span><span>${c * r} Teile</span>`;
      b.addEventListener("click", () => {
        columns = c;
        rows = r;
        load();
        dialog.close();
      });
      content.append(b);
    });
    const dialog = Studio.modal("Kleine oder große Teile?", content);
  }
  function choosePicture() {
    const content = document.createElement("div");
    content.className = "puzzle-pictures";
    list.forEach((it) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", it.name);
      const im = new Image();
      im.src = it.file;
      im.loading = "lazy";
      im.alt = it.name;
      b.append(im);
      b.addEventListener("click", () => {
        file = it.file;
        load();
        dialog.close();
      });
      content.append(b);
    });
    const dialog = Studio.modal("Welches Bild möchtest du puzzeln?", content);
  }
  function layout() {
    if (!image || dragId !== null) return;
    const r = document.querySelector(".puzzle-play").getBoundingClientRect(),
      portrait = innerWidth <= 650,
      ratio = image.naturalWidth / image.naturalHeight;
    let w = portrait ? r.width * 0.94 : r.width * 0.62,
      h = w / ratio;
    const maxHeight = portrait ? r.height * 0.5 : r.height * 0.92;
    if (h > maxHeight) {
      h = maxHeight;
      w = h * ratio;
    }
    board.style.width = Math.round(w) + "px";
    board.style.height = Math.round(h) + "px";
    const trayCols = portrait ? 3 : 2,
      style = getComputedStyle(tray),
      gap = parseFloat(style.gap) || 0,
      padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
      playGap = parseFloat(getComputedStyle(tray.parentElement).gap) || 0;
    let pw = portrait
      ? (r.width - padding - gap * 2) / 3
      : (r.width - w - playGap - padding - gap) / 2;
    const pieceRatio = (ratio * rows) / columns;
    const maxTrayHeight = portrait ? r.height - h - 30 : r.height;
    const rowCount = Math.ceil((columns * rows) / trayCols);
    pw = Math.max(
      48,
      Math.min(
        pw,
        ((maxTrayHeight - (rowCount - 1) * 14 - 20) / rowCount) * pieceRatio,
      ),
    );
    tray.querySelectorAll(".puzzle-piece").forEach((p) => {
      p.style.width = Math.floor(pw) + "px";
      p.style.height = Math.floor(pw / pieceRatio) + "px";
    });
  }
  new ResizeObserver(layout).observe(document.querySelector(".puzzle-play"));
  try {
    const response = await fetch("templates/manifest.json");
    if (!response.ok) throw Error("manifest");
    list = (await response.json()).water;
    const saved = await StudioStore.getDraft("puzzle");
    if (
      saved &&
      list.some((it) => it.file === saved.file) &&
      layouts.some(([c, r]) => c === saved.columns && r === saved.rows)
    ) {
      file = saved.file;
      columns = saved.columns;
      rows = saved.rows;
      placed = (saved.placed || []).filter(
        (n, i, a) =>
          Number.isInteger(n) &&
          n >= 0 &&
          n < columns * rows &&
          a.indexOf(n) === i,
      );
    }
  } catch (_) {}
  await load(false);
})();
