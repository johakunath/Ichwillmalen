/* Tablet presentation is separate from Android's PIN-protected app pinning. */
(function () {
  const host =
    window.frameElement?.id === "tablet-play-frame" ? parent : window;
  const launchedAsApp =
    matchMedia("(display-mode: standalone)").matches ||
    (matchMedia("(display-mode: fullscreen)").matches &&
      !document.fullscreenElement) ||
    navigator.standalone === true;
  let installPrompt;
  const changed = () => dispatchEvent(new Event("tabletchange"));
  if (host === window) {
    addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      changed();
    });
    addEventListener("appinstalled", () => {
      installPrompt = null;
      changed();
    });
    document.addEventListener("fullscreenchange", changed);
  }
  function state() {
    if (host !== window) return host.Tablet.state();
    return {
      installed: launchedAsApp,
      fullscreen:
        !!document.fullscreenElement ||
        matchMedia("(display-mode: fullscreen)").matches,
      browserFullscreen: !!document.fullscreenElement,
      canFullscreen: !!document.fullscreenEnabled,
      canInstall: !!installPrompt && !launchedAsApp,
    };
  }
  async function toggleFullscreen() {
    if (host !== window) return host.Tablet.toggleFullscreen();
    if (document.fullscreenElement) return document.exitFullscreen();
    if (state().fullscreen) return;
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    // Keep the fullscreen document alive while activities navigate inside it.
    // Native fullscreen launches never need this browser fallback.
    if (!document.getElementById("tablet-play-frame")) {
      const frame = document.createElement("iframe");
      frame.id = "tablet-play-frame";
      frame.title = "Ich will malen – Spielzimmer";
      frame.allow = "fullscreen";
      frame.src = location.href;
      for (const child of document.body.children) child.inert = true;
      document.body.classList.add("tablet-host");
      document.body.append(frame);
      frame.addEventListener("load", () => frame.focus(), { once: true });
    }
    // Keep the frame and its artwork alive if the OS or parent exits fullscreen.
  }
  async function install() {
    if (host !== window) return host.Tablet.install();
    if (!installPrompt) return "unavailable";
    const prompt = installPrompt;
    installPrompt = null;
    changed();
    await prompt.prompt();
    return (await prompt.userChoice).outcome;
  }
  function forParents(action) {
    const content = document.createElement("div");
    content.className = "parent-gate";
    content.innerHTML =
      "<p>Dieser Bereich ist für Erwachsene.</p><p>Halte die Taste <strong>3 Sekunden</strong> gedrückt und lass dann los.</p>";
    const hold = Studio.button(
      "hand",
      "3 Sekunden gedrückt halten",
      null,
      "parent-hold wide",
    );
    const label = document.createElement("span");
    label.textContent = "Gedrückt halten";
    hold.append(label);
    const status = document.createElement("p");
    status.className = "hold-status";
    status.setAttribute("role", "status");
    status.textContent = " ";
    content.append(hold, status);
    const dialog = Studio.modal("Für die Großen", content);
    let started = null,
      raf,
      pointer = null,
      key = null;
    function reset() {
      cancelAnimationFrame(raf);
      started = null;
      pointer = key = null;
      hold.style.setProperty("--hold-progress", 0);
      label.textContent = "Gedrückt halten";
      status.textContent = " ";
    }
    function progress() {
      if (started === null) return;
      const amount = Math.min(1, (performance.now() - started) / 3000);
      hold.style.setProperty("--hold-progress", amount);
      if (amount < 1) raf = requestAnimationFrame(progress);
      else {
        label.textContent = "Jetzt loslassen";
        status.textContent = "Bereit. Zum Öffnen loslassen.";
      }
    }
    function start() {
      if (started !== null) return;
      started = performance.now();
      progress();
    }
    function finish() {
      const ready = started !== null && performance.now() - started >= 3000;
      reset();
      if (ready) {
        dialog.close();
        action();
      }
    }
    hold.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || started !== null) return;
      event.preventDefault();
      hold.focus();
      pointer = event.pointerId;
      hold.setPointerCapture(pointer);
      start();
    });
    hold.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointer) return;
      const rect = hold.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        reset();
    });
    hold.addEventListener("pointerup", (event) => {
      if (event.pointerId === pointer) finish();
    });
    hold.addEventListener("pointercancel", reset);
    hold.addEventListener("lostpointercapture", reset);
    hold.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (event.repeat || started !== null) return;
      key = event.key;
      start();
    });
    hold.addEventListener("keyup", (event) => {
      if (event.key === key) {
        event.preventDefault();
        finish();
      }
    });
    hold.addEventListener("blur", reset);
    const onVisibility = () => {
      if (document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", reset);
    dialog.addEventListener("close", () => {
      reset();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", reset);
    });
  }
  function controls(onPlay) {
    const panel = document.createElement("section");
    panel.className = "tablet-setup";
    panel.innerHTML =
      '<h3>Bereit fürs Tablet</h3><p class="tablet-state" role="status"></p><div class="tablet-actions"></div><details class="tablet-help"><summary>Einmal einrichten: Vollbild &amp; App anheften</summary><ol><li><strong>Als App installieren.</strong> In Chrome: ⋮ → „Zum Startbildschirm hinzufügen“ → „Installieren“. Danach das Malatelier über sein eigenes Symbol öffnen.</li><li><strong>Anheften einschalten.</strong> In den Android-Einstellungen nach „App anheften“ suchen. Bei Samsung unter „Sicherheit und Datenschutz“ → „Weitere Sicherheitseinstellungen“. Die PIN-Abfrage zum Lösen aktivieren.</li><li><strong>Vor dem Spielen anheften.</strong> Malatelier öffnen → Übersicht der letzten Apps → Symbol über der App → „Diese App anheften“.</li></ol><p>Zum Lösen bei Gestensteuerung nach oben wischen und halten; bei drei Navigationstasten „Zurück“ und „Letzte Apps“ halten. Anschließend mit deiner Geräte-PIN entsperren. Die Bezeichnungen können je nach Tablet abweichen.</p></details><p class="tablet-note">Vollbild blendet den Browser aus. Erst Androids App-Anheften mit PIN schützt vor dem Verlassen der App. Die Halte-Taste verhindert versehentliche Einstellungsänderungen.</p>';
    const badge = panel.querySelector(".tablet-state");
    const buttons = panel.querySelector(".tablet-actions");
    const full = Studio.button(
      "full",
      "Vollbild spielen",
      async () => {
        try {
          await toggleFullscreen();
          onPlay();
        } catch (_) {
          badge.textContent =
            "Vollbild ist hier nicht verfügbar. Nutze die App-Installation unten.";
          panel.querySelector("details").open = true;
        }
      },
      "wide primary",
    );
    const add = Studio.button(
      "plus",
      "App installieren",
      async () => {
        try {
          const outcome = await install();
          badge.textContent =
            outcome === "accepted"
              ? "Installation bestätigt. Öffne das Malatelier anschließend über sein App-Symbol."
              : "Du kannst die App später über das Browsermenü installieren.";
        } catch (_) {
          badge.textContent = "Bitte über das Browsermenü installieren.";
        }
      },
      "wide",
    );
    add.append(" App installieren");
    buttons.append(full, add);
    function update() {
      const mode = state();
      badge.textContent = mode.installed
        ? mode.fullscreen
          ? "Als App geöffnet · Vollbild aktiv"
          : "Als App geöffnet · ohne Adressleiste"
        : mode.fullscreen
          ? "Vollbild aktiv · App-Anheften in Android einrichten"
          : "Fürs Tablet: als App öffnen und mit PIN anheften";
      full.hidden =
        !mode.canFullscreen || (mode.fullscreen && !mode.browserFullscreen);
      const label = mode.browserFullscreen
        ? "Vollbild beenden"
        : "Vollbild spielen";
      full.innerHTML = Icons("full") + "<span>" + label + "</span>";
      full.setAttribute("aria-label", label);
      full.title = label;
      add.hidden = !mode.canInstall;
    }
    host.addEventListener("tabletchange", update);
    update();
    return {
      panel,
      dispose: () => host.removeEventListener("tabletchange", update),
    };
  }
  // A long press on a picture should not open the browser's image/link menu.
  document.addEventListener("contextmenu", (event) => {
    if (state().fullscreen || state().installed || host !== window)
      event.preventDefault();
  });
  window.Tablet = { state, toggleFullscreen, install, forParents, controls };
})();
