/* Real-browser regression checks. Start `npm start` first. */
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium } = require("playwright");
const base = process.env.APP_URL || "http://127.0.0.1:8000";
const channel = process.env.BROWSER_CHANNEL;
const results = [];
fs.mkdirSync("test-results", { recursive: true });
async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(channel ? { channel } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  async function go(name) {
    await page.goto(base + "/" + name + ".html");
    await page.waitForTimeout(300);
  }
  async function check(name, fn) {
    await fn();
    results.push(name);
    console.log("PASS", name);
  }
  const data = (selector) => page.$eval(selector, (c) => c.toDataURL());
  const stroke = async (selector) => {
    const box = await page.locator(selector).boundingBox();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.55, {
      steps: 18,
    });
    await page.mouse.up();
  };
  try {
    await check("Six picture-led choices on the home screen", async () => {
      await go("index");
      assert.equal(await page.locator(".play-card").count(), 6);
      const last = await page.locator(".play-card").last().boundingBox();
      assert.ok(
        last.y + last.height <= 768,
        "The six main activities should fit a landscape tablet",
      );
    });
    let original, drawn;
    await check("Drawing, exact undo and a new-page recovery", async () => {
      await go("free");
      await page.waitForFunction(
        () => document.getElementById("paper").width === 1600,
      );
      original = await data("#paper");
      await stroke("#paper");
      drawn = await data("#paper");
      assert.notEqual(drawn, original);
      await page
        .getByRole("button", {
          name: "Letzten Strich zurücknehmen",
          exact: true,
        })
        .click();
      assert.equal(await data("#paper"), original);
      await stroke("#paper");
      drawn = await data("#paper");
      await page
        .getByRole("button", { name: "Neues Blatt", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Neues Blatt", exact: true })
        .last()
        .click();
      assert.notEqual(await data("#paper"), drawn);
      await page
        .getByRole("button", {
          name: "Letzten Strich zurücknehmen",
          exact: true,
        })
        .click();
      assert.equal(await data("#paper"), drawn);
    });
    await check("Tablet rotation preserves every drawing pixel", async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(150);
      assert.equal(await data("#paper"), drawn);
      await page.setViewportSize({ width: 1024, height: 768 });
    });
    await check(
      "Two-finger navigation does not leave a stray mark",
      async () => {
        const before = await data("#paper");
        const box = await page.locator("#paper").boundingBox();
        const cdp = await context.newCDPSession(page);
        const p1 = {
            x: box.x + box.width * 0.35,
            y: box.y + box.height * 0.5,
            id: 1,
          },
          p2 = {
            x: box.x + box.width * 0.65,
            y: box.y + box.height * 0.5,
            id: 2,
          };
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [p1],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [p1, p2],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { ...p1, x: p1.x - 40 },
            { ...p2, x: p2.x + 40 },
          ],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        assert.equal(await data("#paper"), before);
        await cdp.detach();
      },
    );
    await check("Saved drawing appears in the album and reopens", async () => {
      await page
        .getByRole("button", {
          name: "Bild in Meine Bilder speichern",
          exact: true,
        })
        .click();
      await page.waitForFunction(() =>
        document
          .querySelector("#studio-toast")
          ?.textContent.includes("Meine Bilder"),
      );
      await page
        .getByRole("link", { name: "Zum Spielzimmer", exact: true })
        .click();
      await page.locator("#albumLink").click();
      await page.waitForSelector(".album-picture");
      await page.locator(".album-picture").first().click();
      await page.getByRole("link", { name: "Weitermachen" }).click();
      await page.waitForTimeout(250);
      assert.equal(await data("#paper"), drawn);
    });
    await check(
      "Drawing draft survives navigation without an explicit save",
      async () => {
        await stroke("#paper");
        const changed = await data("#paper");
        await page
          .getByRole("link", { name: "Zum Spielzimmer", exact: true })
          .click();
        await page.locator('a[href="free.html"]').first().click();
        await page.waitForTimeout(250);
        assert.equal(await data("#paper"), changed);
      },
    );
    await check(
      "Sticker tap, drag, transform, undo and saved composition",
      async () => {
        await go("stickers");
        await page
          .getByRole("button", { name: "Katze hinzufügen", exact: true })
          .click();
        assert.equal(await page.locator(".world-sticker").count(), 1);
        const sticker = page.locator(".world-sticker");
        const before = await sticker.getAttribute("style");
        const box = await sticker.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + 80,
          box.y + box.height / 2 - 40,
          { steps: 10 },
        );
        await page.mouse.up();
        assert.notEqual(await sticker.getAttribute("style"), before);
        await page
          .getByRole("button", { name: "Sticker drehen", exact: true })
          .click();
        assert.ok(
          (await sticker.getAttribute("style")).includes("rotate(20deg)"),
        );
        await page
          .getByRole("button", {
            name: "Letzte Änderung zurücknehmen",
            exact: true,
          })
          .click();
        assert.ok(
          (await sticker.getAttribute("style")).includes("rotate(0deg)"),
        );
        await page
          .getByRole("button", { name: "Klebewelt speichern", exact: true })
          .click();
        await page.waitForFunction(() =>
          document
            .querySelector("#studio-toast")
            ?.textContent.includes("Meine Bilder"),
        );
        await page.reload();
        await page.waitForTimeout(250);
        assert.equal(await page.locator(".world-sticker").count(), 1);
      },
    );
    await check(
      "Sticker can be dragged from the tray into a different world",
      async () => {
        await page.getByRole("button", { name: "Eine andere Welt" }).click();
        await page
          .getByRole("button", { name: "Unterwasser", exact: true })
          .click();
        const piece = await page
            .getByRole("button", { name: "Wal hinzufügen", exact: true })
            .boundingBox(),
          world = await page.locator("#sticker-world").boundingBox();
        await page.mouse.move(
          piece.x + piece.width / 2,
          piece.y + piece.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(
          world.x + world.width * 0.6,
          world.y + world.height * 0.5,
          { steps: 20 },
        );
        await page.mouse.up();
        assert.equal(await page.locator(".world-sticker").count(), 2);
      },
    );
    await check(
      "Puzzle supports incorrect drops, correct drops and tap placement",
      async () => {
        await go("puzzle");
        await page.waitForSelector(".puzzle-piece");
        const piece = page.locator(".puzzle-tray .puzzle-piece").first();
        let i = await piece.getAttribute("data-piece");
        let from = await piece.boundingBox(),
          to = await page.locator(`[data-slot="${i}"]`).boundingBox();
        await page.mouse.move(
          from.x + from.width / 2,
          from.y + from.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(10, 10, { steps: 8 });
        await page.mouse.up();
        assert.equal(await page.locator(".puzzle-piece.placed").count(), 0);
        from = await piece.boundingBox();
        await page.mouse.move(
          from.x + from.width / 2,
          from.y + from.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
          steps: 15,
        });
        await page.mouse.up();
        assert.equal(await page.locator(".puzzle-piece.placed").count(), 1);
        for (const id of await page
          .locator(".puzzle-tray .puzzle-piece")
          .evaluateAll((nodes) => nodes.map((n) => n.dataset.piece))) {
          await page.locator(`[data-piece="${id}"]`).click();
          await page.locator(`[data-slot="${id}"]`).click();
        }
        assert.equal(await page.locator(".puzzle-piece.placed").count(), 4);
        assert.ok(await page.locator(".puzzle-finished").isVisible());
      },
    );
    await check("Puzzle difficulty and replay stay playable", async () => {
      await page
        .getByRole("button", { name: "Anzahl der Puzzleteile" })
        .click();
      await page.getByRole("button", { name: "6 Teile", exact: true }).click();
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".puzzle-piece").count(), 6);
      await page
        .getByRole("button", { name: "Nächstes Puzzle", exact: true })
        .click();
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".puzzle-piece").count(), 6);
    });
    await check(
      "Coloring dark paint is recolorable, undoable and persistent",
      async () => {
        await go("coloring");
        await page.waitForFunction(
          () => document.getElementById("art").width > 1000,
        );
        const initial = await data("#art");
        const r = await page.locator("#art").boundingBox();
        const tap = async () =>
          page.mouse.click(r.x + r.width * 0.45, r.y + r.height * 0.5);
        await page
          .getByRole("button", { name: "Dunkelgrün", exact: true })
          .click();
        await tap();
        const dark = await data("#art");
        assert.notEqual(dark, initial);
        await page.getByRole("button", { name: "Rot", exact: true }).click();
        await tap();
        const red = await data("#art");
        assert.notEqual(red, dark);
        await page
          .getByRole("button", {
            name: "Letzte Farbe zurücknehmen",
            exact: true,
          })
          .click();
        assert.equal(await data("#art"), dark);
        await page.getByRole("link", { name: "Zum Spielzimmer" }).click();
        await go("coloring");
        assert.equal(await data("#art"), dark);
      },
    );
    await check(
      "Library filters, keyboard close and picture changes work",
      async () => {
        await page
          .getByRole("button", { name: "Ein anderes Bild", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Unterwegs", exact: true })
          .click();
        assert.ok((await page.locator(".pcard").count()) > 2);
        await page
          .getByRole("combobox", { name: "Detailgrad" })
          .selectOption("easy");
        assert.ok((await page.locator(".pcard").count()) > 0);
        await page.locator(".pcard").first().click();
        assert.ok(!(await page.locator("#pick").isVisible()));
        await page
          .getByRole("button", { name: "Ein anderes Bild", exact: true })
          .click();
        await page.keyboard.press("Escape");
        assert.ok(!(await page.locator("#pick").isVisible()));
      },
    );
    await check("Water reveal survives undo, resize and reload", async () => {
      await go("water");
      await page.waitForFunction(
        () => document.getElementById("cover").width > 500,
      );
      const original = await data("#cover");
      await stroke("#cover");
      const revealed = await data("#cover");
      assert.notEqual(revealed, original);
      await page.setViewportSize({ width: 768, height: 1024 });
      assert.equal(await data("#cover"), revealed);
      await page
        .getByRole("button", {
          name: "Letzten Wischer zurücknehmen",
          exact: true,
        })
        .click();
      assert.equal(await data("#cover"), original);
      await stroke("#cover");
      const painted = await data("#cover");
      await page.getByRole("link", { name: "Zum Spielzimmer" }).click();
      await go("water");
      assert.equal(await data("#cover"), painted);
      await page.setViewportSize({ width: 1024, height: 768 });
    });
    await check(
      "Search game has visual hints, complete rounds and fresh layouts",
      async () => {
        await go("find");
        assert.equal(await page.locator(".find-friend").count(), 8);
        for (let i = 0; i < 4; i++) {
          await page
            .getByRole("button", { name: "Zeig mir einen kleinen Hinweis" })
            .click();
          await page.locator(".find-hint:not(.found)").click();
          await page.waitForTimeout(580);
        }
        assert.ok(await page.locator("#find-finished").isVisible());
        await page.locator("#find-again").click();
        assert.equal(await page.locator(".find-friend.found").count(), 0);
        assert.equal(await page.locator(".find-friend").count(), 8);
      },
    );
    await check(
      "Color matching needs no number reading and can be completed",
      async () => {
        await go("pbn");
        await page.waitForSelector("#match-art .region");
        const numbers = await page
          .locator("#match-art .region")
          .evaluateAll((nodes) => [
            ...new Set(nodes.map((n) => n.dataset.number)),
          ]);
        for (const number of numbers) {
          await page.locator(`#match-paints [data-number="${number}"]`).click();
          for (const r of await page
            .locator(`#match-art .region[data-number="${number}"]`)
            .all()) {
            const box = await r.boundingBox();
            const background = await r.evaluate((el) => el.tagName === "rect");
            await page.mouse.click(
              box.x + (background ? 20 : box.width / 2),
              box.y + (background ? 20 : box.height / 2),
            );
          }
        }
        assert.ok(await page.locator("#match-finished").isVisible());
        await page
          .getByRole("button", {
            name: "Letzte Farbe zurücknehmen",
            exact: true,
          })
          .click();
        assert.ok(!(await page.locator("#match-finished").isVisible()));
      },
    );
    await check("Pixel painting, undo and draft restore", async () => {
      await go("pixel");
      await page.waitForFunction(
        () => document.querySelector("#pixel-paints")?.children.length > 1,
      );
      const initial = await data("#pixel-paper");
      await stroke("#pixel-paper");
      const painted = await data("#pixel-paper");
      assert.notEqual(painted, initial);
      await page
        .getByRole("button", { name: "Letzte Kästchen zurücknehmen" })
        .click();
      assert.equal(await data("#pixel-paper"), initial);
      await stroke("#pixel-paper");
      const changed = await data("#pixel-paper");
      await page.getByRole("link", { name: "Zum Spielzimmer" }).click();
      await go("pixel");
      assert.equal(await data("#pixel-paper"), changed);
    });
    await check(
      "Every activity renders on landscape, portrait tablet and phone",
      async () => {
        for (const [size, viewport] of Object.entries({
          landscape: { width: 1024, height: 768 },
          portrait: { width: 768, height: 1024 },
          phone: { width: 390, height: 844 },
        })) {
          await page.setViewportSize(viewport);
          for (const name of [
            "index",
            "free",
            "coloring",
            "water",
            "stickers",
            "puzzle",
            "find",
            "pbn",
            "pixel",
            "trace",
          ]) {
            await go(name);
            if (name === "index") {
              assert.ok(
                await page.locator("#albumLink svg").isVisible(),
                "The album icon must remain visible on " + size,
              );
              await page
                .getByRole("button", { name: "Für die Großen", exact: true })
                .click();
              assert.ok(await page.locator("dialog").isVisible());
              await page
                .getByRole("button", { name: "Schließen", exact: true })
                .click();
            }
            if (name === "stickers") {
              const world = await page.locator("#sticker-world").boundingBox();
              assert.ok(
                Math.abs(world.width / world.height - 1.5) < 0.01,
                "Sticker world must preserve its aspect ratio on " + size,
              );
            }
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
              true,
              name + " overflows at " + size,
            );
            await page.screenshot({
              path: `test-results/${name}-${size}.png`,
              fullPage: true,
            });
            const buttons = await page
              .locator(".activity-header button,.activity-header a")
              .evaluateAll((nodes) =>
                nodes.map((n) => ({
                  r: n.getBoundingClientRect().toJSON(),
                  label: n.getAttribute("aria-label"),
                })),
              );
            for (const { r, label } of buttons)
              assert.ok(
                r.x >= -1 && r.right <= viewport.width + 1,
                name + " toolbar clips " + label + " at " + size,
              );
          }
        }
      },
    );
    await check("No browser JavaScript errors", async () =>
      assert.deepEqual(errors, []),
    );
    await context.close();
    await check(
      "Entire app and unvisited library work offline after first install",
      async () => {
        const offlineContext = await browser.newContext({
          viewport: { width: 1024, height: 768 },
        });
        const p = await offlineContext.newPage();
        await p.goto(base + "/index.html");
        await p.waitForFunction(
          async () => {
            const reg = await navigator.serviceWorker.getRegistration();
            return !!reg?.active;
          },
          {},
          { timeout: 60000 },
        );
        await p.evaluate(() => navigator.serviceWorker.ready);
        await p.waitForFunction(() => !!navigator.serviceWorker.controller);
        const ready = await p.evaluate(async () => {
          const names = await caches.keys();
          const name = names.find((n) => n.includes("ichwillmalen:"));
          const cache = await caches.open(name);
          return (await (await cache.match("offline-ready")).text()) === "yes";
        });
        assert.ok(ready);
        await offlineContext.setOffline(true);
        for (const mode of [
          "free",
          "water",
          "coloring",
          "stickers",
          "puzzle",
          "find",
          "pixel",
          "trace",
          "pbn",
        ]) {
          await p.goto(base + "/" + mode + ".html");
          await p.waitForTimeout(100);
          assert.ok(await p.locator(".activity-header").isVisible(), mode);
        }
        const checks = await p.evaluate(async () => {
          const manifest = await (
            await fetch("templates/manifest.json")
          ).json();
          const files = Object.values(manifest)
            .flat()
            .map((i) => i.file);
          return Promise.all(
            files.map(async (file) => [file, (await fetch(file)).ok]),
          );
        });
        assert.ok(
          checks.every(([, ok]) => ok),
          "Some templates were unavailable offline",
        );
        await offlineContext.close();
      },
    );
    fs.writeFileSync(
      "test-results/browser-results.json",
      JSON.stringify({ passed: results, errors }, null, 2),
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
