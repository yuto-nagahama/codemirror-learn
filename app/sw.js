const localForage = require("localforage");
import { extendPrototype } from "localforage-getitems";

self.addEventListener("install", (event) => {
  extendPrototype(localForage);

  const init = async () => {
    const cache = await caches.open("image");
    const dbInstance = localforage.createInstance({ name: "fileCache" });
    const items = await dbInstance.getItems();
    await Promise.all(
      Object.entries(items).map(async ([key, value]) => {
        if (value == null) {
          return;
        }
        await cache.put(key, value);
      })
    );
  };
  event.waitUntil(init());
});

self.addEventListener("fetch", (event) => {
  /** @type {Request} */
  const request = event.request.clone();
  const { pathname } = new URL(request.url);

  if (request.method === "POST" && pathname === "/api/asset/upload") {
    event.respondWith(
      (async () => {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
          return new Response(null, { status: 400 });
        }

        // const headers = {
        //   "Content-Type": file.type,
        // };
        // const response = new Response(file, {
        //   headers,
        // });

        if (file.type.startsWith("image")) {
          const dbInstance = localforage.createInstance({ name: "fileCache" });
          await dbInstance.setItem(`/asset/image/${file.name}`, file);
          // const cacheUrl = `${baseUrl}/image/${file.name}`;
          // const cache = await caches.open("image");
          // await cache.put(new Request(cacheUrl), response);
        }

        return new Response(null, { status: 200 });
      })()
    );
  }

  if (request.method === "GET") {
    const cacheBypass =
      request.cache === "no-cache" ||
      request.headers.get("pragma") === "no-cache";
    console.log(request);
    if (cacheBypass) {
      console.log(request);
    }
    if (pathname.startsWith(`/asset/image`)) {
      event.respondWith(
        (async () => {
          // const cache = await caches.open("image");
          // const res = await cache.match(request);
          const dbInstance = localforage.createInstance({ name: "fileCache" });
          /** @type {File | undefined} */
          const cache = await dbInstance.getItem(pathname);

          if (cache == null) {
            return new Response(null, { status: 404 });
          }
          const headers = {
            "Content-Type": cache.type,
          };
          const res = new Response(cache, {
            headers,
          });

          return res;
        })()
      );
    }
  }
});
