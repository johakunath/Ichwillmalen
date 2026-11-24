/* Fullscreen integration uses real user gestures; Android pinning is a device setting. */
const assert = require("./quiet-assert.cjs");
const fs = require("node:fs");
const { chromium } = require("playwright");
const base = process.env.APP_URL || "http://127.0.0.1:8000";
const results = [];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  fs.mkdirSync("test-results", { recursive: true });
  // A closed dialog leaves the page with its close event, a moment after the
  // next dialog has opened; wait for that instead of counting straight away.
  const onlyOneDialog = () =>
    page.waitForFunction(
      () => document.querySelectorAll("dialog").length === 1,
      null,
      { timeout: 3000 },
    );
  async function check(name, action) {
    await action();
    results.push(name);
    console.log("PASS", name);
  }
  async function hold(scope, duration = 3100) {
    const button = scope.getByRole("button", {
      name: "3 Sekunden gedrückt halten",
    });
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(duration);
    await page.mouse.up();
  }
  async function parents(scope = page) {
    await scope
      .getByRole("button", { name: "Für die Großen", exact: true })
      .click();
    await hold(scope);
    await scope.locator(".tablet-setup").waitFor();
  }
  const fullscreen = () => page.evaluate(() => !!document.fullscreenElement);
  try {
    await page.goto(base + "/index.html");
    await check(
      "Parent gate rejects taps, interrupted holds and pointer cancellation",
      async () => {
        await page.locator("#parents").click();
        await page
          .getByRole("button", { name: "3 Sekunden gedrückt halten" })
          .click();
        assert.equal(await page.locator(".tablet-setup").count(), 0);
        await hold(page, 1600);
        await hold(page, 1600);
        assert.equal(
          await page.locator(".tablet-setup").count(),
          0,
          "Separate holds must not add up",
        );
        const box = await page.locator(".parent-hold").boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(3100);
        await page.mouse.up();
        assert.equal(
          await page.locator(".tablet-setup").count(),
          0,
          "Leaving the button must cancel the hold",
        );
        await page.screenshot({ path: "test-results/tablet-parent-gate.png" });
        await page
          .getByRole("button", { name: "Schließen", exact: true })
          .click();
      },
    );
    await check(
      "Parent gate accepts touch and keyboard holds; settings fit a phone",
      async () => {
        await page.locator("#parents").click();
        const box = await page.locator(".parent-hold").boundingBox();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [
            { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          ],
        });
        await page.waitForTimeout(3100);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await page.locator(".tablet-setup").waitFor();
        await cdp.detach();
        await onlyOneDialog();
        await page
          .getByRole("button", { name: "Schließen", exact: true })
          .click();
        await page.locator("#parents").click();
        await page.locator(".parent-hold").focus();
        await page.keyboard.down("Space");
        await page.waitForTimeout(3100);
        await page.keyboard.up("Space");
        await page.locator(".tablet-setup").waitFor();
        await onlyOneDialog();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator(".tablet-help summary").click();
        const dialog = await page.locator("dialog").boundingBox();
        assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= 391);
        assert.equal(
          await page
            .locator("dialog")
            .evaluate((d) => d.scrollWidth <= d.clientWidth + 1),
          true,
        );
        await page.screenshot({ path: "test-results/tablet-setup-phone.png" });
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.locator(".tablet-help summary").click();
      },
    );
    await check(
      "Unavailable fullscreen keeps the game usable and shows installation help",
      async () => {
        await page.evaluate(() => {
          window.originalRequest = document.documentElement.requestFullscreen;
          document.documentElement.requestFullscreen = () =>
            Promise.reject(new Error("Denied"));
        });
        await page.getByRole("button", { name: "Vollbild spielen" }).click();
        assert.ok(
          (await page.locator(".tablet-state").innerText()).includes(
            "nicht verfügbar",
          ),
        );
        assert.equal(await page.locator("iframe").count(), 0);
        assert.equal(await fullscreen(), false);
        await page.evaluate(() => {
          document.documentElement.requestFullscreen = window.originalRequest;
        });
      },
    );
    const frame = page.frameLocator("#tablet-play-frame");
    await check(
      "Fullscreen stays active through every activity and the album",
      async () => {
        await page.getByRole("button", { name: "Vollbild spielen" }).click();
        await frame.locator(".play-card").first().waitFor();
        assert.equal(await fullscreen(), true);
        for (const name of [
          "free",
          "water",
          "coloring",
          "stickers",
          "puzzle",
          "find",
          "trace",
          "pixel",
          "pbn",
        ]) {
          if (["trace", "pixel", "pbn"].includes(name))
            await frame.locator(".more-toys summary").click();
          await frame.locator(`a[href="${name}.html"]`).first().click();
          await frame.locator(".activity-header").waitFor();
          assert.equal(await fullscreen(), true, name);
          await frame.locator(".home-button").click();
          await frame.locator(".play-card").first().waitFor();
          assert.equal(await fullscreen(), true, "return from " + name);
        }
        await frame.locator("#albumLink").click();
        await frame.locator("#album").waitFor();
        assert.equal(await fullscreen(), true);
        await frame.locator("#roomLink").click();
        await frame.locator(".play-card").first().waitFor();
        await page.screenshot({ path: "test-results/tablet-fullscreen.png" });
      },
    );
    await check(
      "Leaving fullscreen preserves artwork; parents can resume and exit without nesting frames",
      async () => {
        await frame.locator('a[href="free.html"]').first().click();
        const canvas = frame.locator("#paper");
        await canvas.waitFor();
        const box = await canvas.boundingBox();
        await page.mouse.move(
          box.x + box.width * 0.2,
          box.y + box.height * 0.8,
        );
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width * 0.6,
          box.y + box.height * 0.85,
          { steps: 10 },
        );
        await page.mouse.up();
        const painted = await canvas.evaluate((c) => c.toDataURL());
        // The browser/OS can always leave fullscreen. Keep the live activity intact.
        await page.evaluate(() => document.exitFullscreen());
        assert.equal(await fullscreen(), false);
        assert.equal(await canvas.evaluate((c) => c.toDataURL()), painted);
        await frame.locator(".home-button").click();
        await parents(frame);
        await frame.getByRole("button", { name: "Vollbild spielen" }).click();
        // Click dispatch does not await the asynchronous Fullscreen API handler.
        await page.waitForFunction(() => !!document.fullscreenElement, null, {
          timeout: 5000,
        });
        assert.equal(await fullscreen(), true);
        assert.equal(await page.locator("iframe").count(), 1);
        assert.equal(await frame.locator("iframe").count(), 0);
        await parents(frame);
        await frame.getByRole("button", { name: "Vollbild beenden" }).click();
        await page.waitForFunction(() => !document.fullscreenElement, null, {
          timeout: 5000,
        });
        assert.equal(await fullscreen(), false);
        assert.ok(await frame.locator(".play-card").first().isVisible());
      },
    );
    await check(
      "Installation prompts are shown only after a parent chooses Install",
      async () => {
        await page.goto(base + "/index.html");
        await page.evaluate(() => {
          window.promptCalls = 0;
          const event = new Event("beforeinstallprompt", { cancelable: true });
          event.prompt = async () => {
            window.promptCalls++;
          };
          event.userChoice = Promise.resolve({ outcome: "accepted" });
          dispatchEvent(event);
        });
        assert.equal(await page.evaluate(() => window.promptCalls), 0);
        assert.equal(
          await page.getByRole("button", { name: "App installieren" }).count(),
          0,
        );
        await parents();
        await page.getByRole("button", { name: "App installieren" }).click();
        assert.equal(await page.evaluate(() => window.promptCalls), 1);
        assert.ok(
          (await page.locator(".tablet-state").innerText()).includes(
            "Installation bestätigt",
          ),
        );
        assert.equal(
          await page
            .getByRole("button", { name: "App installieren" })
            .isVisible(),
          false,
        );
      },
    );
    await check(
      "A standalone installation can enter lasting fullscreen too (simulated)",
      async () => {
        await page.addInitScript(() => {
          const originalMatch = window.matchMedia;
          window.matchMedia = (query) => {
            const media = originalMatch(query);
            if (query === "(display-mode: standalone)")
              Object.defineProperty(media, "matches", { value: true });
            return media;
          };
        });
        await page.goto(base + "/index.html");
        await parents();
        assert.ok(
          (await page.locator(".tablet-state").innerText()).includes(
            "Als App geöffnet · ohne Adressleiste",
          ),
        );
        await page.getByRole("button", { name: "Vollbild spielen" }).click();
        await frame.locator('a[href="free.html"]').first().click();
        await frame.locator("#paper").waitFor();
        assert.equal(await fullscreen(), true);
        await frame.locator(".home-button").click();
        await frame.locator(".play-card").first().waitFor();
        assert.equal(await fullscreen(), true);
        await page.screenshot({ path: "test-results/tablet-fullscreen.png" });
        await page.evaluate(() => document.exitFullscreen());
      },
    );
    await check(
      "Installed fullscreen display is recognised separately from the Fullscreen API (simulated)",
      async () => {
        await page.addInitScript(() => {
          const originalMatch = window.matchMedia;
          window.matchMedia = (query) => {
            const media = originalMatch(query);
            if (query === "(display-mode: fullscreen)")
              Object.defineProperty(media, "matches", { value: true });
            return media;
          };
        });
        await page.goto(base + "/index.html");
        await parents();
        assert.equal(await fullscreen(), false);
        assert.ok(
          (await page.locator(".tablet-state").innerText()).includes(
            "Als App geöffnet · Vollbild aktiv",
          ),
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Vollbild spielen" })
            .isVisible(),
          false,
        );
        const manifest = await page.evaluate(async () =>
          (await fetch("manifest.webmanifest")).json(),
        );
        assert.equal(manifest.display, "fullscreen");
      },
    );
    await check(
      "Every activity offers fullscreen; the button hides while fullscreen is on",
      async () => {
        const fresh = await context.newPage();
        fresh.on("pageerror", (e) => errors.push(e.message));
        await fresh.goto(base + "/pbn.html");
        await fresh.evaluate(() => (window.unsavedWork = "kept"));
        await fresh.locator(".fullscreen-button").click();
        await fresh.waitForFunction(() => !!document.fullscreenElement, null, {
          timeout: 5000,
        });
        // The activity is not reloaded, so work kept only in memory survives.
        assert.equal(await fresh.evaluate(() => window.unsavedWork), "kept");
        assert.equal(await fresh.locator("iframe").count(), 0);
        assert.equal(
          await fresh.locator(".fullscreen-button").isVisible(),
          false,
        );
        // Following a link keeps fullscreen: the next screen opens in the frame.
        await fresh.locator(".home-button").click();
        await fresh
          .frameLocator("#tablet-play-frame")
          .locator(".play-card")
          .first()
          .waitFor();
        assert.equal(
          await fresh.evaluate(() => !!document.fullscreenElement),
          true,
        );
        await fresh
          .frameLocator("#tablet-play-frame")
          .locator('a[href="water.html"]')
          .first()
          .click();
        await fresh
          .frameLocator("#tablet-play-frame")
          .locator(".activity-header")
          .waitFor();
        assert.equal(
          await fresh
            .frameLocator("#tablet-play-frame")
            .locator(".fullscreen-button")
            .isVisible(),
          false,
        );
        await fresh.evaluate(() => document.exitFullscreen());
        await fresh.close();
      },
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      "test-results/tablet-results.json",
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
