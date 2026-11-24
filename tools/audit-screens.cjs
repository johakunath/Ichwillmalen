/* Screenshot every activity at tablet sizes and build contact sheets.
   Usage: npm start (other terminal), then `node tools/audit-screens.cjs [outDir]`.
   Development tool only; nothing here ships. */
const fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require("playwright");
const base = process.env.APP_URL || "http://127.0.0.1:8000";
const channel = process.env.BROWSER_CHANNEL || "msedge";
const out = path.resolve(process.argv[2] || "test-results/audit");
const pages = [
  "index",
  "free",
  "water",
  "coloring",
  "stickers",
  "puzzle",
  "find",
  "trace",
  "pixel",
  "pbn",
];
const sizes = [
  { tag: "land", width: 1280, height: 800, cols: 3 },
  { tag: "port", width: 800, height: 1280, cols: 5 },
];
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel });
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      hasTouch: true,
      serviceWorkers: "block",
    });
    const page = await context.newPage(),
      shots = [];
    const shoot = async (label) => {
      const file = path.join(out, `${size.tag}-${label}.png`);
      await page.screenshot({ path: file });
      shots.push({ label, file });
    };
    for (const name of pages) {
      await page.goto(`${base}/${name}.html`);
      await page.waitForTimeout(900);
      await shoot(name);
      if (name === "index") {
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(300);
        await shoot("index-bottom");
        continue;
      }
      // Picture activities open with a picker: choose the first picture.
      const card = page.locator("#pick .pcard, .pcard").first();
      if (await card.isVisible().catch(() => false)) {
        await card.click();
        await page.waitForTimeout(900);
        await shoot(name + "-play");
      }
    }
    const cellW = Math.floor(1560 / size.cols),
      html = `<body style="margin:0;background:#222;font:14px sans-serif;color:#fff">
<div style="display:grid;grid-template-columns:repeat(${size.cols},${cellW}px);gap:10px;padding:10px">
${shots.map((s) => `<figure style="margin:0"><img src="data:image/png;base64,${fs.readFileSync(s.file).toString("base64")}" style="width:100%;display:block"><figcaption style="padding:3px 0">${s.label}</figcaption></figure>`).join("")}
</div></body>`;
    const sheet = await context.newPage();
    await sheet.setViewportSize({ width: 1600, height: 900 });
    await sheet.setContent(html);
    await sheet.waitForTimeout(400);
    const per = size.cols * 2,
      rowH = Math.round((cellW * size.height) / size.width) + 34;
    for (let i = 0; i * per < shots.length; i++)
      await sheet.screenshot({
        path: path.join(out, `sheet-${size.tag}-${i + 1}.jpg`),
        type: "jpeg",
        quality: 80,
        clip: {
          x: 0,
          y: i * 2 * rowH,
          width: 1600,
          height: Math.min(
            2 * rowH + 10,
            20 + Math.ceil(shots.length / size.cols) * rowH - i * 2 * rowH,
          ),
        },
        fullPage: true,
      });
    console.log(size.tag, shots.map((s) => s.label).join(", "));
    await context.close();
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
