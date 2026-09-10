const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
const scope = "https://example.test/Ichwillmalen/";
const turn = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function worker({
  match = async () => undefined,
  put = async () => {},
  open,
  fetch: network = async () => new Response("network"),
} = {}) {
  const handlers = {};
  const cache = { match, put };
  const calls = { network: 0, open: 0 };
  vm.runInNewContext(source, {
    self: {
      registration: { scope },
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
    },
    URL,
    Response,
    caches: {
      open: async () => {
        calls.open++;
        return open ? open() : cache;
      },
    },
    fetch: async (request) => {
      calls.network++;
      return network(request);
    },
  });
  function dispatch({
    url = scope + "picture.svg?version=1",
    method = "GET",
    mode = "cors",
  } = {}) {
    let response,
      lifetime,
      dispatching = true;
    handlers.fetch({
      request: { url, method, mode },
      respondWith(promise) {
        assert.ok(dispatching);
        response = promise;
      },
      waitUntil(promise) {
        assert.ok(dispatching, "Register the lifetime promise during dispatch");
        lifetime = promise;
      },
    });
    dispatching = false;
    return { response, lifetime };
  }
  return { dispatch, calls };
}

test("Runtime writes keep the worker alive without holding up the response or consuming its body", async () => {
  const gate = deferred();
  let saved;
  const { dispatch } = worker({
    put: async (key, response) => {
      await gate.promise;
      saved = { key, body: await response.text() };
    },
  });
  const event = dispatch();
  assert.ok(event.response && event.lifetime);
  let returned = false,
    complete = false;
  event.response.then(() => {
    returned = true;
  });
  event.lifetime.then(() => {
    complete = true;
  });
  try {
    await turn();
    assert.equal(returned, true, "A pending write must not delay the page");
    assert.equal(complete, false, "A pending write must keep the event alive");
    assert.equal(await (await event.response).text(), "network");
  } finally {
    gate.resolve();
    await event.lifetime;
  }
  assert.deepEqual(saved, {
    key: "/Ichwillmalen/picture.svg",
    body: "network",
  });
});

test("Cache read/write failures preserve successful network responses", async () => {
  for (const failure of [
    {
      put: async () => {
        throw new Error("quota");
      },
    },
    {
      put: () => {
        throw new Error("storage unavailable");
      },
    },
    {
      match: async () => {
        throw new Error("read failed");
      },
    },
    {
      open: async () => {
        throw new Error("storage denied");
      },
    },
  ]) {
    const event = worker(failure).dispatch({ mode: "navigate" });
    const response = await event.response;
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "network");
    await event.lifetime;
  }
});

test("HTTP errors pass through without polluting the offline cache", async () => {
  for (const status of [404, 500, 503]) {
    let writes = 0;
    const event = worker({
      fetch: async () => new Response("server error", { status }),
      put: async () => {
        writes++;
      },
    }).dispatch();
    const response = await event.response;
    assert.equal(response.status, status);
    assert.equal(await response.text(), "server error");
    await event.lifetime;
    assert.equal(writes, 0);
  }
});

test("Cached HTML and assets retain the installed app version and canonical query keys", async () => {
  for (const mode of ["navigate", "cors"]) {
    const keys = [];
    const { dispatch, calls } = worker({
      match: async (key) => {
        keys.push(key);
        return new Response("installed version");
      },
    });
    const event = dispatch({ url: scope + "index.html?art=123", mode });
    assert.equal(await (await event.response).text(), "installed version");
    await event.lifetime;
    assert.deepEqual(keys, ["/Ichwillmalen/index.html"]);
    assert.equal(calls.network, 0);
  }
});

test("Offline navigations use the cached home; other misses return a usable 503 response", async () => {
  const fetch = async () => {
    throw new Error("offline");
  };
  const home = worker({
    fetch,
    match: async (key) =>
      key === "index.html" ? new Response("home") : undefined,
  });
  const navigation = home.dispatch({ mode: "navigate" });
  assert.equal(await (await navigation.response).text(), "home");
  await navigation.lifetime;
  for (const options of [
    { fetch },
    {
      fetch,
      match: async () => {
        throw new Error("read failed");
      },
    },
    {
      fetch,
      open: async () => {
        throw new Error("storage denied");
      },
    },
  ]) {
    for (const mode of ["navigate", "cors"]) {
      const event = worker(options).dispatch({ mode });
      const response = await event.response;
      assert.equal(response.status, 503);
      assert.equal(await response.text(), "Offline");
      await event.lifetime;
    }
  }
});

test("Unrelated origins, sibling apps and non-GET requests remain untouched", () => {
  const { dispatch, calls } = worker();
  for (const request of [
    { url: "https://other.test/picture.svg" },
    { url: "https://example.test/sibling/index.html" },
    { method: "POST" },
  ]) {
    assert.deepEqual(dispatch(request), {
      response: undefined,
      lifetime: undefined,
    });
  }
  assert.deepEqual(calls, { network: 0, open: 0 });
});
