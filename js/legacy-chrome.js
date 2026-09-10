/* Shared chrome for the small, retained tracing and pixel engines. */
(function () {
  const key = location.pathname.split("/").pop().replace(".html", "");
  const { actions } = Studio.mount(key);
  const labels = {
    bPick: ["gallery", "Bilder"],
    bAgain: ["rotate", "Nochmal"],
    bNew: ["arrow", "Weiter"],
    bClear: ["rotate", "Neu"],
    cLines: ["minus", "Linien"],
    cCurves: ["path", "Wellen"],
    cShapes: ["star", "Formen"],
    cAbc: ["path", "Buchstaben"],
  };
  Object.entries(labels).forEach(([id, [icon, label]]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = Icons(icon) + '<span class="lbl">' + label + "</span>";
    el.setAttribute("aria-label", label);
    el.setAttribute("role", "button");
    el.tabIndex = 0;
  });
  document.querySelectorAll(".sw,.swatch").forEach((el, i) => {
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", el.title || "Farbe " + (i + 1));
    el.tabIndex = 0;
  });
  document.querySelectorAll(".pback").forEach((el) => {
    el.innerHTML = Icons("home");
    el.setAttribute("aria-label", "Zum Spielzimmer");
  });
  const done = document.querySelector("#done span");
  if (done) done.textContent = "Geschafft!";
  const ask = document.querySelector("#ask");
  if (ask) {
    ask.setAttribute("role", "dialog");
    ask.setAttribute("aria-modal", "true");
    ask.querySelector("h2").textContent = "Ein neues Bild?";
    ask.querySelector("p").textContent =
      "Deine Farben werden wieder weggewischt.";
    document.getElementById("askKeep").textContent = "Weitermachen";
    document.getElementById("askWipe").textContent = "Neues Bild";
  }
  if (key === "trace") {
    // Optional letter drills stay behind a separate tool so shapes lead the play.
    document.getElementById("cAbc").style.display = "none";
    actions.append(
      Studio.button("more", "Buchstaben entdecken", () =>
        document.getElementById("cAbc").click(),
      ),
    );
    const colors = document.getElementById("colors");
    if (colors) colors.classList.add("legacy-colors");
  }
  window.dispatchEvent(new Event("resize"));
})();
