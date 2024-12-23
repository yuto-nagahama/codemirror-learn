import { useEffect, useRef, useState } from "react";
import {
  ActionFunction,
  HeadersFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Remote } from "comlink";
import markdownit from "markdown-it";
import hljs from "highlight.js";
import Handlebars from "handlebars";
import { uploadFile } from "~/drive";
import CodemirrorWrapper from "~/components/codemirror/CodemirrorWrapper";
import { generateJwkFromUserId, generateSalt } from "~/crypto";
import { getOAuthClient, getOAuthGenerateUrl, verifyIdToken } from "~/oauth";
import { getSession } from "~/cookie";
import { decrypt } from "~/crypto/session.server";

export const headers: HeadersFunction = () => ({
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
});

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const proc = formData.get("process");

  switch (proc) {
    case "auth": {
      const oAuthClient = await getOAuthClient();
      const url = getOAuthGenerateUrl(oAuthClient);
      return redirect(url);
    }
    case "upload": {
      const cookieHeader = request.headers.get("Cookie");
      const session = await getSession(cookieHeader);
      const idToken = decrypt(session.get("idToken"));
      const accessToken = decrypt(session.get("accessToken"));

      if (!idToken || !accessToken) {
        return null;
      }

      const oAuthClient = await getOAuthClient();
      const verified = await verifyIdToken(oAuthClient, idToken, accessToken);
      const doc = formData.get("doc") as string | null;

      if (verified) {
        await uploadFile(oAuthClient, doc ?? "");
      }

      return null;
    }
    default: {
      return null;
    }
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  return null;
};

const compile = Handlebars.compile;

const markdown = markdownit({
  html: true,
  linkify: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {
        return ""; // use external default escaping
      }
    }

    return ""; // use external default escaping
  },
});

export default function Index() {
  const worker = useRef<Remote<typeof import("../worker")> | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const handleUpdateDoc = (content: string) => {
    setDoc(content);

    if (!worker.current) {
      return;
    }

    const db = worker.current;
    db.exec({
      sql: `insert into report values (?,?) on conflict ( id ) do update set markdown = excluded.markdown`,
      bind: ["1", content],
    });
  };

  useEffect(() => {
    let output = doc;

    try {
      output = compile(doc)({});
    } catch (error) {
      if (error instanceof Error) {
        if (!error.message.includes("Handlebars")) {
          console.error(error);
        }
      }
    } finally {
      setPreview(markdown.render(output ?? ""));
    }
  }, [doc]);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new ComlinkWorker<typeof import("../worker")>(
        new URL("../worker", import.meta.url),
        {
          name: "sqliteComlink",
          type: "module",
        }
      );
      // const sharedWorker = new SharedWorker(
      //   new URL("../worker", import.meta.url)
      // );
      // worker.current = wrap(sharedWorker.port);

      const connectDB = async () => {
        if (!worker.current) {
          return;
        }

        const salt = generateSalt();
        const jwk = await generateJwkFromUserId("1", salt);
        const db = worker.current;
        await db.initializeSQLite(jwk);

        const text = await db.selectValue(
          `select markdown from report where id = ?`,
          ["1"]
        );

        if (typeof text === "string") {
          setDoc(text);
        } else if (typeof text === "undefined") {
          setDoc("");
        }
        setIsLoading(false);
      };

      connectDB();
    }
  }, []);

  useEffect(() => {
    const listener = async (
      event: MessageEvent<
        | { type: "load-asset"; pathname: string }
        | { type: "upload"; file: File }
      >
    ) => {
      const type = event.data.type;

      switch (type) {
        case "load-asset": {
          const db = worker.current;
          const pathname = event.data.pathname;
          const cache = (await db?.selectValue(
            `select data from evidence where path = ?`,
            [pathname]
          )) as Uint8Array | null | undefined;

          navigator.serviceWorker.controller?.postMessage({
            type: "load-complete",
            file: cache ?? null,
          });
          break;
        }
        case "upload": {
          const { file } = event.data;
          const db = worker.current;
          const pathname = `/asset/image/${file.name}`;
          const fileArrayBuffer = new Uint8Array(await file.arrayBuffer());

          db?.exec({
            sql: `insert into evidence (path, data) values (?, ?)`,
            bind: [pathname, fileArrayBuffer],
          });

          navigator.serviceWorker.controller?.postMessage({
            type: "upload-complete",
            pathname,
          });
          break;
        }
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", listener);
    }

    return () => {
      navigator.serviceWorker.removeEventListener("message", listener);
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <Form method="POST" className="flex flex-col gap-8" replace>
      <img src="/logo-dark.png" className="h-24 w-80" />
      <button
        type="submit"
        name="process"
        value="auth"
        className="btn btn-sm w-fit"
      >
        auth
      </button>
      <button
        type="submit"
        name="process"
        value="upload"
        className="btn btn-sm w-fit"
      >
        upload
      </button>
      <input type="hidden" name="doc" value={doc ?? ""} />
      <div className="flex gap-8 size-full">
        {doc != null && (
          <CodemirrorWrapper doc={doc} setDoc={handleUpdateDoc} />
        )}
        <div className="size-full">
          <div
            dangerouslySetInnerHTML={{ __html: preview }}
            className="size-full border border-base-300 prose"
          ></div>
        </div>
      </div>
    </Form>
  );
}
