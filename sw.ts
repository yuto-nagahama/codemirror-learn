import localForage from "localforage";
import { extendPrototype } from "localforage-getitems";
import { Hono } from "hono";
import { handle } from "hono/service-worker";

declare const self: ServiceWorkerGlobalScope;

extendPrototype(localForage);

const CACHE_VERSION = 1;
const expires = 7884000000; // 3ヶ月(ミリ秒)

self.addEventListener("activate", (event) => {
  const fn = async () => {
    const reportDb = localForage.createInstance({
      name: "report",
      version: CACHE_VERSION,
    });
    const reportData = await reportDb.getItems();

    // 3ヶ月以上前のキャッシュは削除する
    const data = Object.entries(reportData);
    await Promise.all(
      data.map(async ([key, value]) => {
        if (Date.now() - value.updatedAt > expires) {
          await reportDb.removeItem(key);
        }
      })
    );
  };
  event.waitUntil(fn());
});

const app = new Hono().basePath("/");

app.post("/api/asset/upload", async (c) => {
  const { req } = c;
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image")) {
    return new Response(null, { status: 400 });
  }

  try {
    const filePath = await new Promise<string | null>(
      async (resolve, reject) => {
        const handler = (event: ExtendableMessageEvent) => {
          try {
            if (event.data.type === "upload-complete") {
              resolve(event.data.pathname as string);
            } else {
              reject("unknown event");
            }
          } catch (error) {
            reject(error);
          } finally {
            self.removeEventListener("message", handler);
          }
        };
        self.addEventListener("message", handler);

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: false,
        });
        clients[0].postMessage({ type: "upload", file });
      }
    ).catch((error) => {
      throw error;
    });

    return new Response(filePath, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 500 });
  }
});

app.get("/asset/image/:id", async (c) => {
  const { req } = c;
  const { pathname } = new URL(req.url);

  try {
    const ab = new AbortController();
    const { signal } = ab;
    const mainFile = await new Promise<File | null>(async (resolve, reject) => {
      const timer = setInterval(() => {
        ab.abort();
      }, 5000);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
      });

      const handler = (event: ExtendableMessageEvent) => {
        try {
          if (event.data.type === "load-complete") {
            clearInterval(timer);
            resolve(event.data.file as File);
          } else {
            reject("unknown event");
          }
        } catch (error) {
          reject(error);
        } finally {
          self.removeEventListener("message", handler);
        }
      };
      self.addEventListener("message", handler);

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: false,
      });
      clients[0].postMessage({ type: "load-asset", pathname });
    }).catch((error) => {
      throw error;
    });

    if (mainFile == null) {
      return new Response(null, { status: 404 });
    }

    const headers = {
      "Content-Type": mainFile.type,
    };
    const res = new Response(mainFile, {
      headers,
    });

    return res;
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 404 });
  }
});

app.notFound((c) => {
  return c.res;
});

self.addEventListener("fetch", handle(app));
