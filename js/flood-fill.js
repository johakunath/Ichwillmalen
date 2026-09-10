/* Immutable outline mask + explicit visited pixels. Dark paint stays recolorable. */
(function (root) {
  function mask(image) {
    const out = new Uint8Array(image.width * image.height),
      d = image.data;
    for (let p = 0; p < out.length; p++) {
      const i = p * 4;
      out[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < 110 ? 1 : 0;
    }
    return out;
  }
  function fill(image, boundary, x, y, color) {
    const { width: w, height: h, data: d } = image;
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= w || y >= h || boundary[y * w + x]) return 0;
    const start = y * w + x,
      si = start * 4,
      source = [d[si], d[si + 1], d[si + 2]];
    if (source.every((v, i) => v === color[i])) return 0;
    const seen = new Uint8Array(w * h),
      stack = [start];
    let changed = 0;
    const matches = (p) =>
      !seen[p] &&
      !boundary[p] &&
      Math.abs(d[p * 4] - source[0]) <= 35 &&
      Math.abs(d[p * 4 + 1] - source[1]) <= 35 &&
      Math.abs(d[p * 4 + 2] - source[2]) <= 35;
    while (stack.length) {
      const p = stack.pop();
      if (!matches(p)) continue;
      const row = Math.floor(p / w),
        right = (row + 1) * w;
      let left = p;
      while (left > row * w && matches(left - 1)) left--;
      let above = false,
        below = false;
      for (let q = left; q < right && matches(q); q++) {
        seen[q] = 1;
        const i = q * 4;
        d[i] = color[0];
        d[i + 1] = color[1];
        d[i + 2] = color[2];
        d[i + 3] = 255;
        changed++;
        if (row > 0) {
          const m = matches(q - w);
          if (m && !above) stack.push(q - w);
          above = m;
        }
        if (row < h - 1) {
          const m = matches(q + w);
          if (m && !below) stack.push(q + w);
          below = m;
        }
      }
    }
    return changed;
  }
  const api = { mask, fill };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloodFill = api;
})(typeof window !== "undefined" ? window : globalThis);
