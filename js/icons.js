/* Small, consistent pictograms. All artwork is local and scales to touch displays. */
(function () {
  const paths = {
    spray:
      '<path d="M8 9h10v12H8ZM11 9V5h5v4M12 5V2h5"/><path d="M5 3h.1M2 2h.1M2 5h.1"/>',
    home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    undo: '<path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12" transform="translate(0 -2)"/>',
    redo: '<path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" transform="translate(0 -2)"/>',
    new: '<path d="M14 3H5v18h14V8Zm0 0v5h5M8 14h8m-4-4v8"/>',
    save: '<path d="M5 3h14v18l-7-4-7 4Z"/><path d="m9 9 2 2 4-4"/>',
    gallery:
      '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1"/>',
    settings: '<path d="M12 8v5m0 3v.1"/><circle cx="12" cy="12" r="9"/>',
    full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    brush:
      '<path d="M14 13 21 3c-4-1-9 4-11 8l4 2ZM10 12c-5-2-4 5-7 7 6 2 11-1 7-7Z"/>',
    crayon: '<path d="m5 15 9-12 6 5-9 12-7 1Zm9-12 6 5M7 13l6 5M4 21l2-5"/>',
    marker: '<path d="m7 15 8-12 6 4-8 12-7 2Zm0 0 6 4M13 6l6 4"/>',
    water:
      '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
    star: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    rainbow:
      '<path d="M2 19v-3a10 10 0 0 1 20 0v3M6 19v-3a6 6 0 0 1 12 0v3M10 19v-3a2 2 0 0 1 4 0v3"/>',
    mirror: '<path d="M12 2v20M8 5C0 0 2 20 8 18Zm8 0c8-5 6 15 0 13Z"/>',
    erase: '<path d="m4 12 9-9 8 8-9 9H7l-5-5ZM8 8l8 8M12 20h10"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>',
    leaf: '<path d="M20 3C7 1 1 9 6 17s18-1 14-14ZM5 21 16 9"/>',
    puzzle:
      '<path d="M9 3H3v6c6-3 6 9 0 6v6h6c-3-6 9-6 6 0h6v-6c-6 3-6-9 0-6V3h-6c3 6-9 6-6 0Z"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    rotate: '<path d="m20 3 1 6-6-1M20 9a8 8 0 1 0-1 9"/>',
    flip: '<path d="M12 2v20M8 5 2 19h6Zm8 0 6 14h-6Z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    minus: '<path d="M4 12h16"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    heart: '<path d="M12 21S1 14 3 7c2-6 8-3 9 0 1-3 7-6 9 0 2 7-9 14-9 14Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    path: '<path d="M3 18C3 4 21 22 21 6" stroke-dasharray="1 5"/><circle cx="3" cy="18" r="2"/><path d="m17 6 4-3 1 5"/>',
    sound:
      '<path d="M3 9h4l5-5v16l-5-5H3Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
    hand: '<path d="M8 12V5a2 2 0 0 1 4 0v6-2a2 2 0 0 1 4 0v3a2 2 0 0 1 4 0v3c0 8-9 9-12 4l-5-6c-1-2 1-4 3-2l2 2"/>',
  };
  window.Icons = (name, cls = "") =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
})();
