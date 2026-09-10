(function () {
  const { actions } = Studio.mount("pbn");
  const art = document.getElementById("match-art"),
    paints = document.getElementById("match-paints");
  let selected = null,
    regions = [],
    history = [],
    version = 0;
  const undo = Studio.button("undo", "Letzte Farbe zurücknehmen", () => {
    const el = history.pop();
    if (!el) return;
    el.dataset.done = "";
    refresh();
  });
  undo.disabled = true;
  actions.append(
    undo,
    Studio.button("gallery", "Ein anderes Farbenbild", () => Gallery.open()),
    Studio.button("arrow", "Nächstes Farbenbild", () => Gallery.next()),
  );
  function select(num) {
    selected = num;
    refresh();
  }
  function pastel(hex, amount) {
    const channels = hex.match(/\w\w/g).map((v) => parseInt(v, 16));
    return (
      "rgb(" +
      channels
        .map((v) => Math.round(v * amount + 255 * (1 - amount)))
        .join(",") +
      ")"
    );
  }
  function refresh() {
    paints.querySelectorAll("button").forEach((b) => {
      const remaining = regions.some(
        (el) => el.dataset.number === b.dataset.number && !el.dataset.done,
      );
      b.classList.toggle("on", b.dataset.number === selected);
      b.setAttribute("aria-pressed", String(b.dataset.number === selected));
      b.classList.toggle("complete-paint", !remaining);
    });
    regions.forEach((el) => {
      el.classList.toggle(
        "match-hint",
        el.dataset.number === selected && !el.dataset.done,
      );
      el.setAttribute(
        "fill",
        el.dataset.done
          ? el.dataset.color
          : pastel(
              el.dataset.color,
              el.dataset.number === selected ? 0.32 : 0.16,
            ),
      );
    });
    undo.disabled = !history.length;
    document.getElementById("match-finished").hidden = regions.some(
      (el) => !el.dataset.done,
    );
  }
  function tap(el) {
    if (el.dataset.done) return;
    if (el.dataset.number !== selected) {
      const correct = paints.querySelector(
        `[data-number="${el.dataset.number}"]`,
      );
      correct?.classList.add("soft-wobble");
      setTimeout(() => correct?.classList.remove("soft-wobble"), 500);
      return;
    }
    history.push(el);
    el.dataset.done = "true";
    if (
      !regions.some((r) => r.dataset.number === selected && !r.dataset.done)
    ) {
      const next = regions.find((r) => !r.dataset.done);
      if (next) selected = next.dataset.number;
    }
    refresh();
  }
  async function load(item) {
    const token = ++version;
    try {
      const response = await fetch(item.file);
      if (!response.ok) throw Error("image");
      const svg = await response.text();
      if (token !== version) return;
      art.innerHTML = svg;
      paints.innerHTML = "";
      history = [];
      regions = Array.from(art.querySelectorAll(".region[data-color]"));
      const byColor = new Map();
      regions.forEach((el) => {
        const num = el.dataset.number,
          col = el.dataset.color;
        byColor.set(num, col);
        el.setAttribute("fill", pastel(col, 0.16));
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Fläche mit Farbe " + num);
        el.addEventListener("pointerdown", (e) => {
          tap(el);
          e.preventDefault();
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            tap(el);
            e.preventDefault();
          }
        });
      });
      // Make small details forgiving: a tap near the selected tiny region snaps to it.
      art.querySelector("svg").addEventListener(
        "pointerdown",
        (e) => {
          const nearby = regions.find((el) => {
            if (el.dataset.done || el.dataset.number !== selected) return false;
            const box = el.getBoundingClientRect();
            return (
              Math.min(box.width, box.height) < 44 &&
              Math.hypot(
                e.clientX - box.x - box.width / 2,
                e.clientY - box.y - box.height / 2,
              ) < 26
            );
          });
          if (nearby) {
            tap(nearby);
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true,
      );
      selected = byColor.keys().next().value;
      byColor.forEach((col, num) => {
        const b = Studio.button(
          "",
          "Farbe " + num,
          () => select(num),
          "paint-pot match-paint",
        );
        b.innerHTML = "<span></span>";
        b.dataset.number = num;
        b.style.setProperty("--paint", col);
        paints.append(b);
      });
      refresh();
    } catch (_) {
      Studio.toast("Dieses Farbenbild konnte nicht geladen werden.");
    }
  }
  Gallery.init({ key: "pbn", withLevels: true, onPick: load });
})();
