/* Shared, picture-first library. Opens straight into a remembered/simple picture. */
(function () {
  const themes = {
    all: ["Alle", "grid"],
    animals: ["Tiere", "cat"],
    vehicles: ["Unterwegs", "car"],
    nature: ["Draußen", "flower"],
    everyday: ["Lieblingsdinge", "house"],
    shapes: ["Formen", "star"],
  };
  const names = {
    "Garden Kitten": "Gartenkatze",
    Duckling: "Entenküken",
    "Baby Dino": "Kleiner Dino",
    Underwater: "Unterwasser",
    Butterfly: "Schmetterling",
    Cat: "Katze",
    Dino: "Dino",
    Whale: "Wal",
    Puppy: "Hündchen",
    Owl: "Eule",
    Turtle: "Schildkröte",
    Unicorn: "Einhorn",
    "Fire Truck": "Feuerwehr",
    "Colorful Train": "Bunter Zug",
    "Farm Tractor": "Traktor",
    Truck: "Lastwagen",
    Rocket: "Rakete",
    Sailboat: "Segelboot",
    Train: "Zug",
    Sunflower: "Sonnenblume",
    "Sand Castle": "Sandburg",
    Rainbow: "Regenbogen",
    Sun: "Sonne",
    Flower: "Blume",
    "Flower garden": "Blumengarten",
    "Rainbow Cottage": "Regenbogenhaus",
    "Ice Cream Sundae": "Eisbecher",
    Balloon: "Ballon",
    House: "Haus",
    Castle: "Burg",
    "Ice cream": "Eis",
    Kite: "Drachen",
    "Free grid": "Freies Bild",
    Fish: "Fisch",
    Tree: "Baum",
    Apple: "Apfel",
    Star: "Stern",
    Heart: "Herz",
    Smiley: "Lächeln",
    Elephant: "Elefant",
    Dinosaur: "Dinosaurier",
    Duck: "Ente",
    "Duck pond": "Ententeich",
    "Butterfly garden": "Schmetterlingsgarten",
    Excavator: "Bagger",
    "Fire truck": "Feuerwehr",
    Car: "Auto",
    Boat: "Boot",
    Airplane: "Flugzeug",
    Tractor: "Traktor",
    Submarine: "U-Boot",
    Beach: "Strand",
    "Teddy bear": "Teddybär",
    "Rainbow house": "Regenbogenhaus",
    "Birthday cake": "Geburtstagstorte",
    Playground: "Spielplatz",
    Parrot: "Papagei",
    "Flower pot": "Blumentopf",
    Meadow: "Blumenwiese",
    "Under the sea": "Unter dem Meer",
    "Busy town": "Kleine Stadt",
  };
  let config,
    list = [],
    theme = "all",
    level = "all",
    current = null,
    previousFocus = null;
  const $ = (id) => document.getElementById(id);
  function label(item) {
    return names[item.name] || item.name;
  }
  function open() {
    previousFocus = document.activeElement;
    $("pick").style.display = "flex";
    $("pick").setAttribute("role", "dialog");
    $("pick").setAttribute("aria-modal", "true");
    $("pick").setAttribute("aria-label", "Ein Bild auswählen");
    $("pickClose").focus();
  }
  function close() {
    $("pick").style.display = "none";
    previousFocus?.focus();
  }
  function pick(item) {
    current = item;
    try {
      localStorage.setItem("studio.last." + config.key, item.file);
    } catch (_) {}
    close();
    $("msg")?.style.setProperty("display", "none");
    config.onPick(item);
  }
  function next() {
    const index = list.indexOf(current);
    pick(list[(index + 1) % list.length]);
  }
  function render() {
    const grid = $("pickGrid");
    grid.innerHTML = "";
    const cards = document.createElement("div");
    cards.className = "pcards";
    list
      .filter(
        (item) =>
          (theme === "all" || item.theme === theme) &&
          (level === "all" || item.level === level),
      )
      .forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pcard";
        button.setAttribute("aria-label", label(item));
        const thumb = document.createElement("div");
        thumb.className = "pthumb";
        if (config.renderThumb) config.renderThumb(item, thumb);
        else {
          const image = new Image();
          image.alt = "";
          image.loading = "lazy";
          image.decoding = "async";
          image.onload = () => image.classList.add("ld");
          image.onerror = () => {
            image.remove();
            thumb.classList.add("failed");
          };
          image.src = item.file;
          thumb.append(image);
        }
        const name = document.createElement("span");
        name.className = "pn";
        name.textContent = label(item);
        button.append(thumb, name);
        button.addEventListener("click", () => pick(item));
        cards.append(button);
      });
    grid.append(cards);
    if (!cards.children.length) {
      const empty = document.createElement("p");
      empty.textContent =
        "Hier gibt es noch keine Bilder. Probiere eine andere Auswahl.";
      grid.append(empty);
    }
  }
  function filters() {
    const row = $("pickFilter");
    row.innerHTML = "";
    const available = [
      "all",
      ...new Set(list.map((item) => item.theme).filter(Boolean)),
    ];
    available.forEach((key) => {
      const pair = themes[key] || [key, "star"];
      const b = document.createElement("button");
      b.className = "library-theme" + (key === theme ? " on" : "");
      b.innerHTML =
        (key === "all" ? Icons("grid") : Art.svg(pair[1])) +
        "<span>" +
        pair[0] +
        "</span>";
      b.setAttribute("aria-pressed", String(key === theme));
      b.addEventListener("click", () => {
        theme = key;
        filters();
        render();
      });
      row.append(b);
    });
    if (config.withLevels && list.some((it) => it.level)) {
      const select = document.createElement("select");
      select.className = "library-level";
      select.setAttribute("aria-label", "Detailgrad");
      [
        ["all", "Alle Bilder"],
        ["easy", "● Große Flächen"],
        ["medium", "●● Mehr Details"],
        ["hard", "●●● Viele Details"],
      ].forEach(([value, text]) => {
        const o = document.createElement("option");
        o.value = value;
        o.textContent = text;
        select.append(o);
      });
      select.value = level;
      select.addEventListener("change", () => {
        level = select.value;
        render();
      });
      row.append(select);
    }
  }
  async function init(opts) {
    config = opts;
    const top = $("pickTop");
    top.querySelector("h2").textContent = "Such dir ein Bild aus";
    const back = top.querySelector(".pback");
    if (back) {
      back.innerHTML = Icons("home");
      back.setAttribute("aria-label", "Zum Spielzimmer");
    }
    const closeButton = $("pickClose");
    closeButton.style.display = "";
    closeButton.innerHTML = Icons("close");
    closeButton.setAttribute("aria-label", "Zurück zum Bild");
    closeButton.addEventListener("click", close);
    $("pick").addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const focusable = Array.from(
          $("pick").querySelectorAll("button,a,select"),
        );
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    try {
      const response = await fetch("templates/manifest.json");
      if (!response.ok) throw new Error("library");
      const manifest = await response.json();
      list = manifest[opts.key] || [];
      if (!list.length) throw new Error("empty");
      filters();
      render();
      let saved;
      try {
        saved = localStorage.getItem("studio.last." + opts.key);
      } catch (_) {}
      const requested = opts.initialFile || saved || opts.defaultFile;
      const initial =
        list.find((it) => it.file === requested) ||
        list.find((it) => it.level === "easy") ||
        list[0];
      pick(initial);
    } catch (_) {
      if ($("msg")) {
        $("msg").textContent =
          "Die Bilder konnten nicht geladen werden. Öffne das Atelier einmal mit Internet und versuche es erneut.";
        $("msg").style.display = "flex";
      }
    }
  }
  window.Gallery = {
    init,
    open,
    close,
    next,
    label,
    get current() {
      return current;
    },
  };
})();
