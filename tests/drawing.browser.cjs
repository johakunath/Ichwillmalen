const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const base = process.env.APP_URL || "http://127.0.0.1:8000";
async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage(),
    errors = [],
    passed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const check = async (name, run) => {
    await run();
    passed.push(name);
    console.log("PASS", name);
  };
  const paper = (scope) => scope.locator('#paper[data-ready="true"]');
  const pixels = (scope) => paper(scope).evaluate((c) => c.toDataURL());
  try {
    await page.goto(base + "/free.html");
    await paper(page).waitFor();
    await check(
      "Tablet canvas fills at least 80% of the screen with every tool visible",
      async () => {
        for (const [width, height] of [
          [1280, 800],
          [1024, 768],
          [768, 1024],
        ]) {
          await page.setViewportSize({ width, height });
          const layout = await page.evaluate(() => {
            const stage = document
              .querySelector("#drawing-stage")
              .getBoundingClientRect();
            const rail = document.querySelector(".drawing-tools");
            return {
              area: (stage.width * stage.height) / (innerWidth * innerHeight),
              scroll: rail.scrollHeight > rail.clientHeight,
              clipped: [
                ...document.querySelectorAll(
                  ".drawing-tools button,.activity-header button",
                ),
              ].filter((b) => {
                const r = b.getBoundingClientRect();
                return (
                  r.x < 0 ||
                  r.y < 0 ||
                  r.right > innerWidth ||
                  r.bottom > innerHeight
                );
              }).length,
            };
          });
          assert.ok(layout.area >= 0.8);
          assert.equal(layout.scroll, false);
          assert.equal(layout.clipped, 0);
          assert.equal(await page.locator("#draw-brushes button").count(), 9);
          assert.equal(await page.locator("#draw-colors button").count(), 12);
          assert.equal(await page.locator("#draw-sizes button").count(), 5);
          await page.screenshot({
            path: `test-results/drawing-tablet-${width}.png`,
          });
        }
        await page.setViewportSize({ width: 1280, height: 800 });
      },
    );
    await check(
      "Zoom buttons, wheel anchoring and hand panning never change the drawing",
      async () => {
        const before = await pixels(page);
        const original = await paper(page).boundingBox();
        await page
          .getByRole("button", { name: "Vergrößern", exact: true })
          .click();
        const bigger = await paper(page).boundingBox();
        assert.ok(bigger.width > original.width * 1.2);
        const pos = { x: 500, y: 360 };
        const uv = {
          x: (pos.x - bigger.x) / bigger.width,
          y: (pos.y - bigger.y) / bigger.height,
        };
        await page.mouse.move(pos.x, pos.y);
        await page.mouse.wheel(0, -160);
        await page.waitForTimeout(100);
        const zoomed = await paper(page).boundingBox();
        assert.ok(Math.abs((pos.x - zoomed.x) / zoomed.width - uv.x) < 0.002);
        assert.ok(Math.abs((pos.y - zoomed.y) / zoomed.height - uv.y) < 0.002);
        await page
          .getByRole("button", { name: "Blatt verschieben", exact: true })
          .click();
        await page.mouse.move(500, 360);
        await page.mouse.down();
        await page.mouse.move(560, 400, { steps: 5 });
        await page.mouse.up();
        assert.notEqual((await paper(page).boundingBox()).x, zoomed.x);
        assert.equal(await pixels(page), before);
        await page
          .getByRole("button", { name: "Ganzes Blatt zeigen", exact: true })
          .click();
        const fit = await paper(page).boundingBox(),
          stage = await page.locator("#drawing-stage").boundingBox();
        assert.ok(
          fit.width <= stage.width + 1 && fit.height <= stage.height + 1,
        );
      },
    );
    await check(
      "Fine liner widths and pen pressure produce distinct, finer marks",
      async () => {
        // Exercise the renderer directly on transparent paper to inspect pigment width.
        const stats = await page.evaluate(() => {
          const draw = (brush, size, pressure) => {
            const c = document.createElement("canvas");
            c.width = 300;
            c.height = 150;
            const ctx = c.getContext("2d");
            const state = { remaining: 0, hue: 0 };
            Brushes.render(
              ctx,
              { x: 20, y: 75, p: pressure },
              { x: 280, y: 75, p: pressure },
              {
                brush,
                size,
                color: "#223344",
                rainbow: false,
                mirror: false,
                width: 300,
                paper: "#fff",
              },
              state,
            );
            Brushes.finish(
              ctx,
              { brush, color: "#223344", rainbow: false, width: 300 },
              state,
            );
            const d = ctx.getImageData(100, 0, 1, 150).data;
            const ys = [];
            let colorError = 0;
            for (let y = 0; y < 150; y++) if (d[y * 4 + 3] > 10) ys.push(y);
            for (let y = 0; y < 150; y++) {
              if (d[y * 4 + 3] > 100) {
                [34, 51, 68].forEach((value, channel) => {
                  colorError = Math.max(
                    colorError,
                    Math.abs(d[y * 4 + channel] - value),
                  );
                });
              }
            }
            return {
              colorError,
              width: ys.length ? ys.at(-1) - ys[0] + 1 : 0,
              pixels: c.toDataURL(),
            };
          };
          return {
            thin: draw("ink", 1, 0.5),
            wide: draw("ink", 12, 0.5),
            light: draw("brush", 12, 0.15),
            heavy: draw("brush", 12, 0.9),
            tools: Brushes.tools
              .filter(([k]) => k !== "erase")
              .map(([k]) => draw(k, 12, 0.5).pixels),
          };
        });
        assert.ok(stats.thin.width > 0 && stats.thin.width <= 2);
        assert.ok(stats.wide.width >= 10);
        assert.ok(stats.heavy.width > stats.light.width * 1.5);
        assert.ok(
          stats.heavy.colorError <= 3,
          "Soft brush edges must not turn black",
        );
        assert.equal(new Set(stats.tools).size, 8);
      },
    );
    await check(
      "Coalesced soft-brush samples tint and composite only once per pointer event",
      async () => {
        for (const name of ["Pinsel", "Wasserfarbe"]) {
          await page.getByRole("button", { name, exact: true }).click();
          await page.evaluate(() => {
            document.querySelector("#drawing-stage").addEventListener(
              "pointerdown",
              (e) => {
                window.testPointerId = e.pointerId;
              },
              { once: true },
            );
          });
          await page.mouse.move(350, 330);
          await page.mouse.down();
          const before = await pixels(page);
          const counts = await page.evaluate(() => {
            const proto = CanvasRenderingContext2D.prototype;
            const fill = proto.fillRect,
              copy = proto.drawImage;
            const render = Brushes.render;
            const counts = { samples: 0, tints: 0, copies: 0 };
            proto.fillRect = function (...args) {
              if (
                this.globalCompositeOperation === "source-in" &&
                args[2] === this.canvas.width &&
                args[3] === this.canvas.height
              )
                counts.tints++;
              return fill.apply(this, args);
            };
            proto.drawImage = function (...args) {
              if (this.canvas.id === "paper") counts.copies++;
              return copy.apply(this, args);
            };
            Brushes.render = function (...args) {
              counts.samples++;
              return render(...args);
            };
            try {
              const samples = Array.from(
                { length: 16 },
                (_, i) =>
                  new PointerEvent("pointermove", {
                    pointerId: window.testPointerId,
                    pointerType: "pen",
                    buttons: 1,
                    clientX: 360 + i * 10,
                    clientY: 330 + i,
                    pressure: 0.2 + i * 0.04,
                  }),
              );
              const move = new PointerEvent("pointermove", {
                pointerId: window.testPointerId,
                pointerType: "pen",
                buttons: 1,
                clientX: 510,
                clientY: 345,
                pressure: 0.8,
              });
              Object.defineProperty(move, "getCoalescedEvents", {
                value: () => samples,
              });
              document.querySelector("#drawing-stage").dispatchEvent(move);
              return counts;
            } finally {
              proto.fillRect = fill;
              proto.drawImage = copy;
              Brushes.render = render;
            }
          });
          await page.mouse.up();
          assert.deepEqual(counts, { samples: 16, tints: 1, copies: 2 }, name);
          assert.notEqual(
            await pixels(page),
            before,
            name + " must paint the samples",
          );
        }
      },
    );
    await check(
      "Pen hover permits immediate pinching; cancelled gestures preserve redo",
      async () => {
        await page
          .getByRole("button", { name: "Fineliner", exact: true })
          .click();
        const before = await pixels(page);
        await page.mouse.move(350, 330);
        await page.mouse.down();
        await page.mouse.move(600, 350, { steps: 10 });
        await page.mouse.up();
        const painted = await pixels(page);
        assert.notEqual(painted, before);
        await page
          .getByRole("button", {
            name: "Letzten Strich zurücknehmen",
            exact: true,
          })
          .click();
        await page.locator("#drawing-stage").dispatchEvent("pointermove", {
          pointerId: 50,
          pointerType: "pen",
          clientX: 400,
          clientY: 300,
          pressure: 0,
        });
        const cdp = await context.newCDPSession(page);
        const a = { x: 400, y: 330, id: 1 },
          b = { x: 650, y: 330, id: 2 };
        const start = await paper(page).boundingBox();
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [a],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [a, b],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { ...a, x: 350 },
            { ...b, x: 700 },
          ],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        assert.ok((await paper(page).boundingBox()).width > start.width * 1.2);
        assert.equal(await pixels(page), before);
        assert.equal(
          await page
            .getByRole("button", { name: "Strich wiederholen", exact: true })
            .isEnabled(),
          true,
        );
        await page
          .getByRole("button", { name: "Strich wiederholen", exact: true })
          .click();
        assert.equal(await pixels(page), painted);
        await cdp.detach();
      },
    );
    await check(
      "Direct fullscreen preserves the live drawing, selected pen and undo history",
      async () => {
        await page
          .getByRole("button", { name: "Filzstift", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Pinselgröße 3", exact: true })
          .click();
        const before = await pixels(page);
        await page.mouse.move(400, 430);
        await page.mouse.down();
        await page.mouse.move(650, 450, { steps: 10 });
        await page.mouse.up();
        const painted = await pixels(page);
        await page
          .getByRole("button", { name: "Vollbild", exact: true })
          .click();
        const frame = page.frameLocator("#tablet-play-frame");
        await paper(frame).waitFor();
        assert.equal(
          await page.evaluate(() => !!document.fullscreenElement),
          true,
        );
        assert.equal(await pixels(frame), painted);
        const fullSize = await paper(frame).boundingBox();
        await frame
          .getByRole("button", { name: "Vergrößern", exact: true })
          .click();
        assert.ok(
          (await paper(frame).boundingBox()).width > fullSize.width * 1.2,
          "The transferred camera must remain usable after the original document is hidden",
        );
        assert.equal(await pixels(frame), painted);
        assert.equal(
          await frame
            .locator('[data-brush="marker"]')
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await frame.locator('[data-size="3"]').getAttribute("aria-pressed"),
          "true",
        );
        await frame
          .getByRole("button", {
            name: "Letzten Strich zurücknehmen",
            exact: true,
          })
          .click();
        assert.equal(await pixels(frame), before);
        await page.evaluate(() => document.exitFullscreen());
        assert.equal(await pixels(frame), before);
      },
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      "test-results/drawing-results.json",
      JSON.stringify({ passed, errors }, null, 2),
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
