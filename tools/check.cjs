/* Every check in one command, with short output: `npm run check`.
   Runs the core tests, starts the local server if none is running, runs the
   three browser suites and prints one summary line per suite. Only failures
   print detail. On Windows without Playwright's own Chromium it uses Edge. */
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs"),
  http = require("node:http"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
const base = process.env.APP_URL || "http://127.0.0.1:8000";
const serverUp = () =>
  new Promise((resolve) =>
    http
      .get(base, (response) => {
        response.resume();
        resolve(true);
      })
      .on("error", () => resolve(false)),
  );
function browserChannel() {
  if (process.env.BROWSER_CHANNEL) return process.env.BROWSER_CHANNEL;
  try {
    if (fs.existsSync(require("playwright").chromium.executablePath()))
      return "";
  } catch (_) {}
  return process.platform === "win32" ? "msedge" : "";
}
function run(label, args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  const lines = ((result.stdout || "") + (result.stderr || "")).split(/\r?\n/);
  const passed = lines.filter((l) => /^(PASS |✔ )/.test(l)).length;
  const ok = result.status === 0;
  console.log(
    `${label.padEnd(8)} ${ok ? "ok    " : "FAILED"} ${passed} passed`,
  );
  if (!ok)
    console.log(
      lines
        .filter((l) => l.trim() && !/^(PASS |✔ |ℹ |> )/.test(l))
        .slice(-25)
        .map((l) => "    " + (l.length > 240 ? l.slice(0, 240) + " …" : l))
        .join("\n"),
    );
  return { ok, passed };
}
async function main() {
  const results = [
    run("core", [
      "--test",
      "tests/core.test.cjs",
      "tests/service-worker.test.cjs",
    ]),
  ];
  let server = null;
  if (!(await serverUp())) {
    server = spawn(process.execPath, ["tools/serve.cjs"], {
      cwd: root,
      stdio: "ignore",
    });
    for (let i = 0; i < 40 && !(await serverUp()); i++)
      await new Promise((resolve) => setTimeout(resolve, 250));
  }
  try {
    if (!(await serverUp())) throw new Error("No local server at " + base);
    const channel = browserChannel();
    const env = channel ? { BROWSER_CHANNEL: channel } : {};
    for (const [label, file] of [
      ["browser", "tests/browser.cjs"],
      ["tablet", "tests/tablet.browser.cjs"],
      ["drawing", "tests/drawing.browser.cjs"],
    ])
      results.push(run(label, [file], env));
  } finally {
    if (server) server.kill();
  }
  const total = results.reduce((sum, r) => sum + r.passed, 0);
  const failed = results.some((r) => !r.ok);
  console.log(failed ? "CHECK FAILED" : `CHECK OK: ${total} checks passed`);
  process.exit(failed ? 1 : 0);
}
main().catch((error) => {
  console.error("CHECK FAILED: " + error.message);
  process.exit(1);
});
