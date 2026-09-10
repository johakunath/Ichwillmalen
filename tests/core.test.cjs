const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const { mask, fill } = require("../js/flood-fill.js");
function image(w, h, color = [255, 255, 255]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data.set([...color, 255], i);
  }
  return { width: w, height: h, data };
}
test("A filled dark region can be recolored, without eating its outline", () => {
  const im = image(9, 9);
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++)
      if (x === 0 || x === 8 || y === 0 || y === 8)
        im.data.set([20, 20, 20, 255], (y * 9 + x) * 4);
  const boundary = mask(im);
  assert.equal(fill(im, boundary, 4, 4, [40, 45, 40]), 49);
  assert.equal(fill(im, boundary, 4, 4, [221, 104, 94]), 49);
  assert.deepEqual([...im.data.slice(0, 4)], [20, 20, 20, 255]);
});
test("Similar colors terminate and fill every connected pixel once", () => {
  const im = image(100, 100, [240, 240, 240]);
  assert.equal(fill(im, mask(im), 0, 0, [250, 250, 250]), 10000);
  assert.equal(fill(im, mask(im), 0, 0, [250, 250, 250]), 0);
});
test("Boundaries isolate neighboring areas; edge taps are safe", () => {
  const im = image(7, 7);
  for (let y = 0; y < 7; y++) im.data.set([0, 0, 0, 255], (y * 7 + 3) * 4);
  const boundary = mask(im);
  assert.equal(fill(im, boundary, 0, 0, [221, 104, 94]), 21);
  assert.equal(im.data[(3 * 7 + 5) * 4], 255);
  assert.equal(fill(im, boundary, 3, 4, [100, 100, 100]), 0);
  assert.equal(fill(im, boundary, -1, 4, [100, 100, 100]), 0);
  assert.equal(fill(im, boundary, 7, 4, [100, 100, 100]), 0);
});
test("Every shipped template exists and pixel matrices are consistent", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "templates/manifest.json")),
  );
  let count = 0;
  for (const [mode, items] of Object.entries(manifest)) {
    assert.ok(items.length > 0);
    for (const item of items) {
      assert.ok(fs.existsSync(path.join(root, item.file)), item.file);
      count++;
      if (mode === "pixel") {
        const t = JSON.parse(fs.readFileSync(path.join(root, item.file)));
        if (t.target) {
          assert.equal(t.target.length, t.rows, item.file);
          for (const row of t.target) {
            assert.equal(row.length, t.cols, item.file);
            assert.ok(
              row.every((n) => n >= 0 && n < t.palette.length),
              item.file,
            );
          }
        }
      }
    }
  }
  assert.ok(count >= 90);
});
test("Every application script parses, including inline tracing code", () => {
  for (const file of fs
    .readdirSync(path.join(root, "js"))
    .map((f) => "js/" + f)
    .concat(["theme.js", "gallery.js", "sw.js"])) {
    new vm.Script(fs.readFileSync(path.join(root, file), "utf8"), {
      filename: file,
    });
  }
  for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))
      new vm.Script(match[1], { filename: file });
  }
});
test("All local HTML script, stylesheet and icon references resolve", () => {
  for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|data:)/.test(match[1])) continue;
      assert.ok(
        fs.existsSync(path.join(root, match[1].split("?")[0])),
        file + " -> " + match[1],
      );
    }
  }
});
test("The offline shell contains every application script and page", () => {
  const env = {
    self: {
      registration: { scope: "https://example.test/Ichwillmalen/" },
      addEventListener() {},
    },
  };
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(root, "sw.js"), "utf8"), env);
  const shell = vm.runInContext("SHELL", env);
  for (const file of shell)
    assert.ok(fs.existsSync(path.join(root, file)), file);
  for (const file of fs.readdirSync(path.join(root, "js")))
    assert.ok(shell.includes("js/" + file), file);
  for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html")))
    assert.ok(shell.includes(file), file);
});
test("Every sticker and world is available without remote assets", () => {
  const env = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js/art.js"), "utf8"),
    env,
  );
  assert.equal(env.window.Art.keys.length, 25);
  assert.equal(Object.keys(env.window.Art.backgrounds).length, 4);
  for (const key of env.window.Art.keys) {
    assert.ok(env.window.Art.names[key]);
    const svg = env.window.Art.svg(key);
    assert.ok(!svg.includes("undefined"));
    assert.ok(!/(?:forty|fifty|sixty|twenty|seventy|ninety)/.test(svg));
    assert.ok(!svg.includes('href="http'));
  }
});
