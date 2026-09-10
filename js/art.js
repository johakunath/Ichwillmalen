/* Original, reusable paper-cut illustrations for the studio and sticker toy. */
(function () {
  const face =
    '<g fill="#344741"><circle cx="43" cy="48" r="2.3"/><circle cx="59" cy="48" r="2.3"/></g><path d="M47 56q4 4 8 0" fill="none" stroke="#344741" stroke-width="2.4" stroke-linecap="round"/>';
  const art = {
    sun:
      '<g stroke="#EFB747" stroke-width="6" stroke-linecap="round"><path d="M50 5v9m0 72v9M5 50h9m72 0h9M18 18l7 7m50 50 7 7M82 18l-7 7M25 75l-7 7"/></g><circle cx="50" cy="50" r="29" fill="#F9C85C"/>' +
      face,
    cat:
      '<path d="M20 42 17 10l27 19h13L82 9l-3 34c16 46-73 50-59-1" fill="#E9A06C"/><path d="m24 18 3 20 12-10m35-10-4 20-9-10" fill="#F3BF9D"/>' +
      face +
      '<path d="m34 57-18-3m18 9-17 4m50-10 17-3m-17 9 17 4" stroke="#946344" stroke-width="2" stroke-linecap="round"/>',
    bunny:
      '<ellipse cx="34" cy="27" rx="12" ry="25" fill="#F2E6D0"/><ellipse cx="65" cy="27" rx="12" ry="25" fill="#F2E6D0"/><ellipse cx="34" cy="26" rx="5" ry="18" fill="#EFA8A7"/><ellipse cx="65" cy="26" rx="5" ry="18" fill="#EFA8A7"/><ellipse cx="50" cy="61" rx="34" ry="30" fill="#F2E6D0"/><g transform="translate(0 11)">' +
      face +
      "</g>",
    bear:
      '<circle cx="24" cy="24" r="16" fill="#B98A64"/><circle cx="76" cy="24" r="16" fill="#B98A64"/><rect x="17" y="19" width="66" height="66" rx="29" fill="#CC9E76"/><ellipse cx="51" cy="61" rx="17" ry="12" fill="#F2D6B6"/>' +
      face,
    frog: '<circle cx="28" cy="31" r="16" fill="#86B879"/><circle cx="71" cy="31" r="16" fill="#86B879"/><ellipse cx="50" cy="58" rx="40" ry="28" fill="#95C78A"/><circle cx="29" cy="30" r="8" fill="white"/><circle cx="70" cy="30" r="8" fill="white"/><circle cx="30" cy="31" r="3" fill="#344741"/><circle cx="69" cy="31" r="3" fill="#344741"/><path d="M32 58q18 20 36 0" fill="none" stroke="#496D49" stroke-width="3" stroke-linecap="round"/>',
    fox: '<path d="m10 13 32 14h16l32-14-7 45-33 30-33-30Z" fill="#DE8E61"/><path d="M16 50q25-5 34 24Q64 44 84 50L50 88Z" fill="#FFF3DA"/><circle cx="33" cy="46" r="3" fill="#344741"/><circle cx="67" cy="46" r="3" fill="#344741"/><path d="m44 72 6 6 6-6" fill="#344741"/>',
    fish: '<path d="m66 48 28-24v49L66 55" fill="#DE8E61"/><ellipse cx="42" cy="49" rx="33" ry="26" fill="#ECAF76"/><path d="M44 28q-12 21 0 42" fill="none" stroke="#F8DDAF" stroke-width="10"/><circle cx="23" cy="45" r="3" fill="#344741"/>',
    whale:
      '<path d="M8 60C-2 11 70 3 73 49q14 0 15-17l8 7q4 42-32 42H37Q10 81 8 60" fill="#76ACBD"/><path d="M19 65q18 20 48 3" fill="#C8DFDF"/><circle cx="26" cy="44" r="3" fill="#344741"/><path d="M36 12V3m0 9 9-7m-9 7-9-7" stroke="#A8D4DC" stroke-width="4" stroke-linecap="round"/>',
    octopus:
      '<path d="M20 61V36c0-35 60-35 60 0v25q20 31 9 32L74 76q11 26-2 20L59 77q5 23-7 21L43 77q-2 24-14 19l2-22Q4 104 7 84Z" fill="#C898BE"/>' +
      face,
    turtle:
      '<circle cx="85" cy="44" r="12" fill="#96B981"/><path d="m27 66-5 16m43-16 4 15" stroke="#96B981" stroke-width="12" stroke-linecap="round"/><path d="M8 61c-3-60 69-57 70 0Z" fill="#668F69"/><path d="m19 55 17-23h21l13 23M36 32l-4 28m25-28 4 28" fill="none" stroke="#A7C89C" stroke-width="3"/><circle cx="89" cy="41" r="2" fill="#344741"/>',
    star:
      '<path d="m50 5 14 27 31 5-22 23 4 32-27-15-28 15 5-32L5 37l31-5Z" fill="#F6CA61"/>' +
      face,
    moon: '<path d="M68 7C28 28 39 78 88 66 65 106 7 86 10 45 12 17 39 0 68 7" fill="#F5D78A"/><circle cx="30" cy="47" r="3" fill="#766B50"/><path d="M28 58q7 7 13 0" stroke="#766B50" stroke-width="2" fill="none"/>',
    rocket:
      '<path d="m35 69 15 29 15-29" fill="#E9B256"/><path d="m32 44-19 32 23-7m32-25 19 32-23-7" fill="#CB7770"/><path d="M32 69V40Q33 16 50 3q17 13 18 37v29Z" fill="#F9E9CB"/><path d="M39 17q11-15 22 0Z" fill="#CB7770"/><circle cx="50" cy="39" r="12" fill="#80AFBA" stroke="#E7CCA5" stroke-width="5"/>',
    planet:
      '<circle cx="51" cy="50" r="28" fill="#BC9BC6"/><ellipse cx="50" cy="51" rx="47" ry="12" transform="rotate(-25 50 51)" stroke="#E9CAA0" stroke-width="8" fill="none"/>',
    ufo: '<path d="M29 46c0-41 42-41 42 0" fill="#A8C9C3"/><ellipse cx="50" cy="51" rx="45" ry="15" fill="#9BA7B9"/><path d="m36 66-9 28h46L64 66" fill="#F1D886" fill-opacity=".6"/><g fill="#F1D886"><circle cx="22" cy="53" r="4"/><circle cx="50" cy="57" r="4"/><circle cx="78" cy="53" r="4"/></g>',
    flower:
      '<path d="M50 50v44" stroke="#749B70" stroke-width="7" stroke-linecap="round"/><path d="M47 78Q17 48 18 78q6 15 29 8" fill="#9ABF85"/><g fill="#DE9EAD"><circle cx="50" cy="18" r="17"/><circle cx="72" cy="33" r="17"/><circle cx="64" cy="57" r="17"/><circle cx="37" cy="57" r="17"/><circle cx="28" cy="33" r="17"/></g><circle cx="50" cy="38" r="17" fill="#F3CA68"/>',
    tree: '<path d="M45 45h11v50H45Z" fill="#B58C66"/><circle cx="50" cy="28" r="26" fill="#8DB080"/><circle cx="29" cy="50" r="26" fill="#8DB080"/><circle cx="71" cy="50" r="26" fill="#8DB080"/><path d="M50 58 35 43m15 21 15-20" stroke="#688F68" stroke-width="3" stroke-linecap="round"/>',
    mushroom:
      '<path d="m38 45-4 42q17 15 34 0l-7-42" fill="#EBDCBF"/><path d="M5 50c4-61 84-61 90 0Z" fill="#CF8175"/><g fill="#F8E7CA"><circle cx="34" cy="23" r="7"/><circle cx="63" cy="34" r="9"/><circle cx="20" cy="40" r="5"/></g>',
    rainbow:
      '<g fill="none" stroke-width="13"><path d="M11 77V50a39 39 0 0 1 78 0v27" stroke="#D68F80"/><path d="M24 77V50a26 26 0 0 1 52 0v27" stroke="#EDC676"/><path d="M37 77V50a13 13 0 0 1 26 0v27" stroke="#8CAC90"/></g><g fill="#FFFDF6"><ellipse cx="15" cy="77" rx="15" ry="10"/><ellipse cx="85" cy="77" rx="15" ry="10"/></g>',
    cloud:
      '<path d="M22 76C-6 76-4 40 23 43 18 5 76 0 79 39c29-4 31 37 3 37Z" fill="#FFFDF5"/>',
    house:
      '<rect x="20" y="40" width="60" height="51" rx="5" fill="#E9C484"/><path d="m6 44 44-38 44 38Z" fill="#BB7A70"/><path d="M42 91V61h19v30" fill="#8FAA9A"/><rect x="26" y="52" width="12" height="15" rx="2" fill="#FAEACA"/><path d="M32 52v15m-6-7h12" stroke="#BBA67B" stroke-width="2"/>',
    car: '<path d="m19 39 15-21h32l16 21 10 7v27H8V47Z" fill="#D98F77"/><path d="m30 38 10-14h20l12 14Z" fill="#DCE5DA"/><g fill="#465552"><circle cx="27" cy="73" r="13"/><circle cx="74" cy="73" r="13"/></g><g fill="#EFE2C7"><circle cx="27" cy="73" r="5"/><circle cx="74" cy="73" r="5"/></g>',
    boat: '<path d="M50 6v64" stroke="#AD8B68" stroke-width="4"/><path d="m43 10-33 48h33Z" fill="#EED6A3"/><path d="m56 16 31 42H56Z" fill="#C6897A"/><path d="m8 67 11 20h62l12-20Z" fill="#719CAA"/><path d="M5 94q15-8 30 0t30 0 30 0" stroke="#A1C5CA" stroke-width="4" fill="none"/>',
    balloon:
      '<path d="M51 71q-15 12 0 24" stroke="#9C917E" stroke-width="2" fill="none"/><ellipse cx="50" cy="34" rx="29" ry="33" fill="#DDA1AF"/><path d="m50 63-7 9h14Z" fill="#C38A9A"/><path d="M34 17q-9 7-8 18" stroke="#F1C5CC" stroke-width="5" stroke-linecap="round" fill="none"/>',
    butterfly:
      '<path d="M48 48C3-13-12 60 31 60-8 100 52 88 48 48" fill="#DCA9B7"/><path d="M52 48c45-61 60 12 17 12 39 40-21 28-17-12" fill="#E9C987"/><path d="M50 34v39m0-39-8-9m8 9 8-9" stroke="#6F8070" stroke-width="5" stroke-linecap="round"/>',
  };
  const names = {
    sun: "Sonne",
    cat: "Katze",
    bunny: "Hase",
    bear: "Bär",
    frog: "Frosch",
    fox: "Fuchs",
    fish: "Fisch",
    whale: "Wal",
    octopus: "Krake",
    turtle: "Schildkröte",
    star: "Stern",
    moon: "Mond",
    rocket: "Rakete",
    planet: "Planet",
    ufo: "Ufo",
    flower: "Blume",
    tree: "Baum",
    mushroom: "Pilz",
    rainbow: "Regenbogen",
    cloud: "Wolke",
    house: "Haus",
    car: "Auto",
    boat: "Boot",
    balloon: "Ballon",
    butterfly: "Schmetterling",
  };
  function svg(name, cls = "") {
    return `<svg class="${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${art[name] || art.sun}</svg>`;
  }
  function place(name, x, y, size, rotation = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${rotation} ${size / 2} ${size / 2}) scale(${size / 100})">${art[name]}</g>`;
  }
  const backgrounds = {
    garden:
      '<rect width="1200" height="800" fill="#E8EEDC"/><path d="M0 550Q300 380 600 550T1200 500V800H0" fill="#CCD8B5"/><path d="M0 670Q350 480 650 680t550-60V800H0" fill="#B4C69E"/>',
    sea: '<rect width="1200" height="800" fill="#DBEDF0"/><path d="M0 200q150-55 300 0t300 0 300 0 300 0v600H0" fill="#A7CCD4"/><path d="M0 500q300-110 600 0t600 0v300H0" fill="#83B4C2"/><path d="M0 730q250-70 600 0t600 0v70H0" fill="#EBDCB9"/><g fill="none" stroke="#C4E1E3" stroke-width="3"><circle cx="95" cy="360" r="13"/><circle cx="1050" cy="450" r="18"/><circle cx="1030" cy="390" r="9"/></g>',
    space:
      '<rect width="1200" height="800" fill="#383E5A"/><g fill="#DCD5BE"><circle cx="70" cy="80" r="3"/><circle cx="400" cy="130" r="4"/><circle cx="860" cy="80" r="3"/><circle cx="1100" cy="250" r="4"/><circle cx="140" cy="560" r="3"/><circle cx="720" cy="340" r="3"/><circle cx="420" cy="610" r="3"/><circle cx="920" cy="620" r="5"/><circle cx="600" cy="55" r="2"/></g><path d="M0 780Q600 630 1200 780v20H0" fill="#74738C"/>',
    town: '<rect width="1200" height="800" fill="#E4EAE1"/><path d="M0 560h1200v240H0" fill="#BECBBA"/><path d="M0 650h1200v120H0" fill="#A5ADA5"/><path d="M0 710h1200" stroke="#EAE5D7" stroke-width="8" stroke-dasharray="50 40"/><path d="M0 550h1200" stroke="#F2E1BD" stroke-width="24"/>',
  };
  window.Art = {
    svg,
    place,
    names,
    keys: Object.keys(art),
    backgrounds,
    scene: (name) =>
      `<svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">${backgrounds[name] || backgrounds.garden}</svg>`,
  };
})();
