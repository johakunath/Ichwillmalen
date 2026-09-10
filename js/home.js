(function () {
  const p = Art.place;
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
      art:
        '<g transform="rotate(-7 155 87)"><rect x="70" y="25" width="169" height="129" rx="6" fill="#FFFDF4"/><path d="M90 112q31-54 54-24t68-39" fill="none" stroke="#DF9E84" stroke-width="10" stroke-linecap="round"/><path d="M106 123q26-31 46-16t42-5" fill="none" stroke="#A3B18B" stroke-width="7" stroke-linecap="round"/>' +
        p("sun", 162, 38, 42) +
        '</g><g transform="rotate(25 70 120)"><rect x="46" y="72" width="15" height="90" rx="3" fill="#7B9D7D"/><path d="m46 72 7-18 8 18" fill="#D5BA87"/><rect x="46" y="90" width="15" height="44" fill="#B3C09B"/></g><g transform="rotate(36 247 105)"><rect x="239" y="55" width="17" height="96" rx="3" fill="#D2917B"/><path d="m239 55 8-20 9 20" fill="#DDC69B"/><rect x="239" y="73" width="17" height="50" fill="#EDB599"/></g>',
    },
    {
      key: "water",
      name: "Zauberwasser",
      sub: "Wisch die Farben wach",
      bg: "#DDEBE9",
      ink: "#6F9D9C",
      art:
        '<defs><clipPath id="reveal"><ellipse cx="155" cy="86" rx="87" ry="59"/></clipPath></defs>' +
        p("cloud", 27, 20, 70) +
        '<g clip-path="url(#reveal)"><rect x="60" y="20" width="200" height="140" fill="#F3ECD4"/>' +
        p("rainbow", 91, 20, 111) +
        p("flower", 174, 93, 60) +
        p("frog", 88, 86, 69) +
        '</g><path d="M83 123q39 31 87 14" stroke="#FFFDF8" stroke-width="9" stroke-linecap="round" opacity=".6" fill="none"/><g fill="none" stroke="#A8C9C2" stroke-width="2"><circle cx="46" cy="114" r="10"/><circle cx="259" cy="45" r="7"/><circle cx="259" cy="123" r="14"/></g>' +
        p("star", 228, 17, 26),
    },
    {
      key: "coloring",
      name: "Bunte Bilder",
      sub: "Ein Fingertipp, ganz viel Farbe",
      bg: "#E5E9D6",
      ink: "#879A6C",
      art:
        '<g transform="rotate(6 155 90)"><rect x="77" y="18" width="155" height="143" rx="7" fill="#FFFDF6"/>' +
        p("butterfly", 99, 30, 110) +
        '<path d="M155 66c40-54 53 11 15 11 34 35-18 24-15-11" fill="#FFFDF6" stroke="#718576" stroke-width="2"/></g><circle cx="46" cy="90" r="14" fill="#DCA9B7"/><circle cx="54" cy="127" r="14" fill="#EAC16D"/><circle cx="262" cy="67" r="13" fill="#9CB99A"/><circle cx="261" cy="108" r="13" fill="#94B8C4"/>',
    },
    {
      key: "stickers",
      name: "Klebewelten",
      sub: "Erfinde deine eigene kleine Welt",
      bg: "#EBE4DA",
      ink: "#AD9275",
      badge: "Zum Erfinden",
      art:
        '<path d="M0 141q70-31 146-5t164-11v55H0" fill="#CAD3B5"/>' +
        p("tree", 210, 17, 110) +
        p("cloud", 20, 8, 67) +
        p("bunny", 70, 53, 90, -9) +
        p("mushroom", 181, 103, 60, 8) +
        p("flower", 22, 97, 67, -12) +
        p("butterfly", 167, 24, 43, 18),
    },
    {
      key: "puzzle",
      name: "Bilderpuzzle",
      sub: "Teil für Teil ein kleines Wunder",
      bg: "#E4E5ED",
      ink: "#9494B0",
      art:
        '<g transform="rotate(-6 150 88)"><rect x="78" y="20" width="155" height="141" rx="10" fill="#FFFCF1"/>' +
        p("fox", 100, 34, 109) +
        '<path d="M155 20v42c-27-15-27 35 0 20v79M78 90h33c-14 27 35 27 21 0h23m0 0h78" fill="none" stroke="#D6D7E1" stroke-width="4"/></g><g transform="translate(235 109) rotate(12)"><path d="M0 0h23c-10-20 25-20 17 0h22v50H0Z" fill="#B4BEA1"/></g>',
    },
    {
      key: "find",
      name: "Suchspaß",
      sub: "Wer hat sich hier versteckt?",
      bg: "#EDE5CF",
      ink: "#A29869",
      art:
        p("tree", 11, 40, 131) +
        p("flower", 216, 40, 82) +
        p("mushroom", 73, 90, 80) +
        p("bunny", 169, 48, 70) +
        '<g transform="rotate(-25 159 89)"><path d="M157 119v58" stroke="#8FA084" stroke-width="17" stroke-linecap="round"/><circle cx="157" cy="74" r="46" fill="#FFFDF5A3" stroke="#91A287" stroke-width="11"/>' +
        p("frog", 128, 46, 59) +
        "</g>",
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
      '<div class="card-art"><svg viewBox="0 0 310 180" aria-hidden="true"><g class="floaty">' +
      card.art +
      '</g></svg></div><div class="card-caption"><div><h3>' +
      card.name +
      "</h3><p>" +
      card.sub +
      '</p></div><span class="card-arrow">' +
      Icons("arrow") +
      "</span></div>";
    document.getElementById("activities").append(a);
  });
  document.getElementById("parents").addEventListener("click", Studio.settings);
  const ideas = [
    ["cat", "Wie sieht deine Lieblingskatze aus?"],
    ["rocket", "Wohin fliegt deine Rakete?"],
    ["rainbow", "Wie bunt ist dein Regenbogen?"],
    ["house", "Wer wohnt in deinem Traumhaus?"],
    ["flower", "Erfinde eine neue Blume."],
    ["fish", "Male einen Fantasiefisch."],
    ["bear", "Ein Freund für deinen Bären?"],
    ["planet", "Wie sieht dein Planet aus?"],
  ];
  let idea = Math.floor(Math.random() * ideas.length);
  function showIdea() {
    document.getElementById("ideaPicture").innerHTML = Art.svg(ideas[idea][0]);
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
