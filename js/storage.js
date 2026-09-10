/* IndexedDB keeps large pictures out of localStorage. Writes are transactional. */
(function () {
  let connection;
  function db() {
    if (!connection)
      connection = new Promise((resolve, reject) => {
        const request = indexedDB.open("ichwillmalen-studio", 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("art", { keyPath: "id" });
          request.result.createObjectStore("drafts");
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    return connection;
  }
  async function transact(name, mode, fn) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(name, mode);
      let result;
      const request = fn(transaction.objectStore(name));
      if (request)
        request.onsuccess = () => {
          result = request.result;
        };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error("Speichern abgebrochen"));
    });
  }
  window.StudioStore = {
    getDraft: (key) =>
      transact("drafts", "readonly", (store) => store.get(key)),
    draft: (key, data) =>
      transact("drafts", "readwrite", (store) => store.put(data, key)),
    list: async () =>
      (await transact("art", "readonly", (store) => store.getAll())).sort(
        (a, b) => b.created - a.created,
      ),
    add: (item) => transact("art", "readwrite", (store) => store.put(item)),
    remove: (id) => transact("art", "readwrite", (store) => store.delete(id)),
    get: (id) => transact("art", "readonly", (store) => store.get(id)),
  };
})();
