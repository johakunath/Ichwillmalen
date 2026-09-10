(function () {
  const titles = {
    free: ["Malatelier", "Alles beginnt mit einem Strich."],
    water: ["Zauberwasser", "Wisch die Farben wach."],
    coloring: ["Bunte Bilder", "Eine Farbe. Ein Fingertipp."],
    stickers: ["Klebewelten", "Deine Welt, wie sie dir gefällt."],
    puzzle: ["Bilderpuzzle", "Jedes Teil findet seinen Platz."],
    find: ["Suchspaß", "Schau mal, wer sich versteckt."],
    trace: ["Zauberspuren", "Folge deiner Fantasie."],
    pixel: ["Kästchenkunst", "Aus kleinen Kästchen wird ein Bild."],
    pbn: ["Farbenfreunde", "Finde die passende Farbe."],
  };
  function button(icon, label, action, cls = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "studio-button " + cls;
    b.innerHTML = Icons(icon);
    b.setAttribute("aria-label", label);
    b.title = label;
    if (action) b.addEventListener("click", action);
    return b;
  }
  let toastTimer, currentModal;
  function toast(message) {
    let el = document.getElementById("studio-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "studio-toast";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }
  function modal(title, content) {
    if (currentModal) currentModal.close();
    const previous = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.className = "studio-dialog";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const top = document.createElement("div");
    top.className = "dialog-top";
    top.append(
      heading,
      button("close", "Schließen", () => dialog.close()),
    );
    dialog.append(top, content);
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (currentModal === dialog) {
        currentModal = null;
        previous?.focus();
      }
    });
    dialog.showModal();
    currentModal = dialog;
    return dialog;
  }
  function confirmNew(action) {
    const content = document.createElement("div");
    content.className = "new-sheet";
    content.innerHTML =
      '<div class="paper-pair">' +
      Icons("gallery") +
      Icons("arrow") +
      Icons("new") +
      "</div><p>Ein frisches Blatt? Dein letztes Bild kannst du mit dem Zurück-Pfeil wiederholen.</p>";
    const row = document.createElement("div");
    row.className = "dialog-actions";
    const no = button("back", "Weitermalen", () => dialog.close(), "wide");
    no.append(" Weitermalen");
    const yes = button(
      "new",
      "Neues Blatt",
      () => {
        action();
        dialog.close();
      },
      "wide primary",
    );
    yes.append(" Neues Blatt");
    row.append(no, yes);
    content.append(row);
    const dialog = modal("Platz für eine neue Idee", content);
  }
  async function save(canvas, kind, data) {
    try {
      const preview = document.createElement("canvas");
      const ratio = Math.min(1, 900 / Math.max(canvas.width, canvas.height));
      preview.width = Math.round(canvas.width * ratio);
      preview.height = Math.round(canvas.height * ratio);
      const ctx = preview.getContext("2d");
      ctx.fillStyle = "#fffdf8";
      ctx.fillRect(0, 0, preview.width, preview.height);
      ctx.drawImage(canvas, 0, 0, preview.width, preview.height);
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random().toString(36).slice(2);
      await StudioStore.add({
        id,
        created: Date.now(),
        kind,
        preview: preview.toDataURL("image/webp", 0.85),
        data,
      });
      toast("Dein Bild ist in „Meine Bilder“");
      const b = document.querySelector("[data-save]");
      if (b) {
        b.classList.add("saved");
        setTimeout(() => b.classList.remove("saved"), 1300);
      }
      return true;
    } catch (_) {
      toast(
        "Speichern ist gerade nicht möglich. Bitte ein Bild herunterladen.",
      );
      return false;
    }
  }
  function download(canvas) {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "mein-kunstwerk.png";
    a.click();
  }
  function select(group, chosen) {
    group.querySelectorAll("button").forEach((b) => {
      const active = b === chosen;
      b.classList.toggle("on", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  function colors(container, callback, initial) {
    THEME.palette.forEach((color, i) => {
      const b = button(
        "",
        THEME.names[i],
        () => {
          select(container, b);
          callback(color);
        },
        "paint-pot",
      );
      b.innerHTML = "<span></span>";
      b.style.setProperty("--paint", color);
      b.classList.toggle("on", color === initial);
      b.setAttribute("aria-pressed", String(color === initial));
      container.append(b);
    });
  }
  function settings() {
    Tablet.forParents(showSettings);
  }
  function showSettings() {
    const content = document.createElement("div");
    content.className = "parent-content";
    const tablet = Tablet.controls(() => dialog.close());
    content.append(tablet.panel);
    const about = document.createElement("details");
    about.className = "studio-about";
    about.innerHTML =
      "<summary>Über das kleine Atelier</summary><p>Ohne Werbung, Konten, Zeitdruck oder Punkte. Bilder bleiben auf diesem Gerät.</p><p>Finger und Stift können malen. Im Malatelier verschieben und vergrößern zwei Finger das Blatt. Der Stift hat beim Malen Vorrang.</p><p>Einmal online öffnen und die Bilder laden lassen. Danach klappt das Spielen auch ohne Internet.</p>";
    content.append(about);
    const status = document.createElement("p");
    status.className = "offline-status";
    status.textContent = "Offline-Bilder werden vorbereitet …";
    content.append(status);
    let onStatus;
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "CACHE_STATUS" });
      });
      onStatus = (e) => {
        if (e.data.type === "CACHE_STATUS")
          status.textContent = e.data.ready
            ? "Alle Bilder sind offline bereit."
            : "Bilder werden noch geladen. Lass das Atelier kurz geöffnet.";
      };
      navigator.serviceWorker.addEventListener("message", onStatus);
    } else
      status.textContent =
        "Offline-Installation benötigt HTTPS oder localhost.";
    const dialog = modal("Für die Großen", content);
    dialog.addEventListener("close", () => {
      tablet.dispose();
      if (onStatus)
        navigator.serviceWorker.removeEventListener("message", onStatus);
    });
  }
  function mount(key) {
    document.body.dataset.mode = key;
    document.documentElement.lang = "de";
    document.title = (titles[key]?.[0] || "Spielzimmer") + " · Ich will malen";
    document.getElementById("back")?.remove();
    const header = document.createElement("header");
    header.className = "activity-header";
    const home = document.createElement("a");
    home.className = "studio-button home-button";
    home.href = "index.html";
    home.innerHTML = Icons("home");
    home.setAttribute("aria-label", "Zum Spielzimmer");
    header.append(home);
    const title = document.createElement("div");
    title.className = "activity-title";
    title.innerHTML =
      "<strong>" +
      titles[key][0] +
      "</strong><span>" +
      titles[key][1] +
      "</span>";
    header.append(title);
    const actions = document.createElement("div");
    actions.className = "header-actions";
    header.append(actions);
    document.body.prepend(header);
    document.querySelectorAll(".btn").forEach((b) => {
      b.setAttribute("role", "button");
      if (b.tagName !== "BUTTON") b.tabIndex = 0;
    });
    return { header, actions };
  }
  // Keyboard parity for the remaining legacy controls.
  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches('[role="button"]:not(button)')
    ) {
      e.preventDefault();
      e.target.click();
    }
  });
  window.Studio = {
    button,
    toast,
    modal,
    confirmNew,
    save,
    download,
    select,
    colors,
    settings,
    mount,
    titles,
  };
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    addEventListener("load", () =>
      navigator.serviceWorker
        .register("sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => reg.active?.postMessage({ type: "CACHE_LIBRARY" }))
        .catch(() => {}),
    );
})();
