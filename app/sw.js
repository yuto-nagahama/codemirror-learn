import localForage from "localforage";
import { extendPrototype } from "localforage-getitems";
extendPrototype(localForage);

const CACHE_VERSION = 0;
const expires = 7884000000; // 3ヶ月(ミリ秒)

self.addEventListener("activate", (event) => {
  const fn = async () => {
    console.log(1111);
    const dbInstance = localForage.createInstance({
      name: "fileCache",
      version: CACHE_VERSION,
    });
    /** @type { { [key in string]: { createdAt: number, file: File } } } */
    const items = await dbInstance.getItems();

    // 3ヶ月以上前のキャッシュは削除する
    await Promise.all(
      Object.entries(items).map(async ([key, value]) => {
        if (Date.now() - value.createdAt > expires) {
          await dbInstance.removeItem(key);
        }
      })
    );
  };
  event.waitUntil(fn());
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

        if (file.type.startsWith("image")) {
          const dbInstance = localForage.createInstance({
            name: "fileCache",
            version: CACHE_VERSION,
          });
          await dbInstance.setItem(`/asset/image/${file.name}`, {
            createdAt: Date.now(),
            file,
          });
        }

        return new Response(null, { status: 200 });
      })()
    );
  }

  if (request.method === "GET") {
    if (pathname.startsWith(`/asset/image`)) {
      event.respondWith(
        (async () => {
          const dbInstance = localForage.createInstance({ name: "fileCache" });
          /** @type { { createdAt: number, file: File } | undefined } */
          const cache = await dbInstance.getItem(pathname);

          if (cache == null) {
            return new Response(null, { status: 404 });
          }

          const headers = {
            "Content-Type": cache.type,
          };
          const res = new Response(cache.file, {
            headers,
          });

          return res;
        })()
      );
    }
  }
});
