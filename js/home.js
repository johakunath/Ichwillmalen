(function () {
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = Icons(el.dataset.icon)));
  document.getElementById("brandMark").innerHTML = Art.svg("rainbow");
  const cards = [
    {
      key: "free",
      name: "Malatelier",
      sub: "Kritzeln, pinseln, staunen",
      bg: "#F0E5CB",
      ink: "#9E875B",
    },
    {
      key: "water",
      name: "Zauberwasser",
      sub: "Wisch die Farben wach",
      bg: "#DDEBE9",
      ink: "#6F9D9C",
    },
    {
      key: "coloring",
      name: "Bunte Bilder",
      sub: "Ein Fingertipp, ganz viel Farbe",
      bg: "#E5E9D6",
      ink: "#879A6C",
    },
    {
      key: "stickers",
      name: "Klebewelten",
      sub: "Erfinde deine eigene kleine Welt",
      bg: "#EBE4DA",
      ink: "#AD9275",
      badge: "Zum Erfinden",
    },
    {
      key: "puzzle",
      name: "Bilderpuzzle",
      sub: "Teil für Teil ein kleines Wunder",
      bg: "#E4E5ED",
      ink: "#9494B0",
    },
    {
      key: "find",
      name: "Suchspaß",
      sub: "Wer hat sich hier versteckt?",
      bg: "#EDE5CF",
      ink: "#A29869",
    },
  ];
  cards.forEach((card) => {
    const a = document.createElement("a");
    a.href = card.key + ".html";
    a.className = "play-card";
    a.style.setProperty("--card-bg", card.bg);
    a.style.setProperty("--card-ink", card.ink);
    a.setAttribute("aria-label", card.name + " – " + card.sub);
    a.innerHTML =
      (card.badge ? '<span class="card-badge">' + card.badge + "</span>" : "") +
      '<div class="card-art"><img class="floaty" src="templates/cards/' +
      card.key +
      '.webp" alt="" draggable="false" /></div><div class="card-caption"><div><h3>' +
      card.name +
      "</h3><p>" +
      card.sub +
      '</p></div><span class="card-arrow">' +
      Icons("arrow") +
      "</span></div>";
    document.getElementById("activities").append(a);
  });
  document.getElementById("parents").addEventListener("click", Studio.settings);
  // Ideas are shown as sticker pictures (templates/stickers/<name>.webp); the
  // sentence is for a parent to read aloud.
  const ideas = [
    ["trex", "Was macht dein Dino heute?"],
    ["bagger", "Was baut dein Bagger?"],
    ["rakete", "Wohin fliegt deine Rakete?"],
    ["feuerwehrauto", "Wohin fährt die Feuerwehr?"],
    ["baustein-turm", "Wie hoch wird dein Turm?"],
    ["dampflok", "Wer fährt mit dem Zug?"],
    ["vulkan", "Was wächst am Vulkan?"],
    ["astronaut", "Wen trifft dein Astronaut?"],
  ];
  let idea = Math.floor(Math.random() * ideas.length);
  function showIdea() {
    document.getElementById("ideaPicture").innerHTML =
      '<img src="templates/stickers/' +
      ideas[idea][0] +
      '.webp" alt="" draggable="false" />';
    document.getElementById("ideaPicture").href =
      "free.html?idea=" + ideas[idea][0];
    document.getElementById("ideaText").textContent = ideas[idea][1];
  }
  document.getElementById("newIdea").addEventListener("click", () => {
    idea = (idea + 1) % ideas.length;
    showIdea();
  });
  showIdea();
  let albumRender = 0;
  async function renderAlbum() {
    const renderId = ++albumRender;
    const grid = document.getElementById("albumGrid");
    grid.innerHTML = "";
    try {
      let items = await StudioStore.list();
      // Preserve the old album. Import is idempotent, and never clears its source.
      let old = [];
      try {
        const parsed = JSON.parse(
          localStorage.getItem("kidpaint.gallery.v1") || "[]",
        );
        if (Array.isArray(parsed)) old = parsed;
      } catch (_) {}
      for (const item of old) {
        if (item.data && !items.some((i) => i.id === "legacy-" + item.id))
          await StudioStore.add({
            id: "legacy-" + item.id,
            created: Number(item.id) || Date.now(),
            kind: "legacy",
            preview: item.data,
          });
      }
      if (old.length) items = await StudioStore.list();
      if (renderId !== albumRender) return;
      if (!items.length) {
        grid.innerHTML =
          '<div class="album-empty">' +
          Art.svg("rainbow") +
          '<h2>Hier ist Platz für deine Ideen.</h2><p>Tippe beim Malen auf das Lesezeichen.<br>Dann hängt dein Bild hier.</p><a href="free.html" class="studio-button wide primary">' +
          Icons("brush") +
          " Losmalen</a></div>";
        return;
      }
      items.forEach((item) => {
        const b = document.createElement("button");
        b.className = "album-picture";
        b.setAttribute("aria-label", "Kunstwerk öffnen");
        const img = new Image();
        img.src = item.preview;
        img.alt = "Dein Kunstwerk";
        img.loading = "lazy";
        const caption = document.createElement("span");
        caption.textContent = new Date(item.created).toLocaleDateString(
          "de-DE",
          { day: "numeric", month: "long" },
        );
        b.append(img, caption);
        b.addEventListener("click", () => openArtwork(item));
        grid.append(b);
      });
    } catch (_) {
      grid.innerHTML =
        '<div class="album-empty"><h2>Deine Bilder brauchen Gerätespeicher.</h2><p>Bitte erlaube dem Browser, Daten auf diesem Gerät zu speichern.<br>Du kannst trotzdem spielen und Bilder herunterladen.</p></div>';
    }
  }
  function openArtwork(item) {
    const content = document.createElement("div");
    const img = new Image();
    img.className = "album-preview";
    img.src = item.preview;
    img.alt = "Dein Kunstwerk";
    content.append(img);
    const row = document.createElement("div");
    row.className = "dialog-actions";
    if (
      ["free", "stickers", "coloring", "pixel"].includes(item.kind) &&
      item.data
    ) {
      const open = document.createElement("a");
      open.className = "studio-button wide primary";
      open.href = item.kind + ".html?art=" + encodeURIComponent(item.id);
      open.innerHTML = Icons("brush") + " Weitermachen";
      row.append(open);
    }
    const download = Studio.button(
      "download",
      "Bild herunterladen",
      () => {
        const a = document.createElement("a");
        a.href = item.preview;
        a.download = "mein-kunstwerk.webp";
        a.click();
      },
      "wide",
    );
    download.append(" Mitnehmen");
    row.append(download);
    content.append(row);
    Studio.modal("Dein Kunstwerk", content);
  }
  function route() {
    const isAlbum = location.hash === "#bilder";
    document.getElementById("playroom").hidden = isAlbum;
    document.getElementById("album").hidden = !isAlbum;
    document.getElementById("roomLink").classList.toggle("active", !isAlbum);
    document.getElementById("albumLink").classList.toggle("active", isAlbum);
    document
      .getElementById("roomLink")
      .setAttribute("aria-current", isAlbum ? "false" : "page");
    document
      .getElementById("albumLink")
      .setAttribute("aria-current", isAlbum ? "page" : "false");
    if (isAlbum) renderAlbum();
  }
  addEventListener("hashchange", route);
  route();
})();
