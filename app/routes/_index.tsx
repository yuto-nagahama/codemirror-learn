import { useEffect, useRef, useState } from "react";
import {
  ActionFunction,
  HeadersFunction,
  LoaderFunction,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Remote } from "comlink";
import markdownit from "markdown-it";
import hljs from "highlight.js";
import Handlebars from "handlebars";
import { authorize, listFiles, uploadFile } from "~/drive";
import CodemirrorWrapper from "~/components/codemirror/CodemirrorWrapper";
import { generateJwkFromUserId, generateSalt } from "~/crypto";

export const headers: HeadersFunction = () => ({
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
});

export const action: ActionFunction = async ({ request }) => {
  const client = await authorize(request.headers.get("goog_drv_token"));
  const text = (await request.formData()).get("doc") as string | null;
  await uploadFile(client, text ?? "");
  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const client = await authorize(request.headers.get("goog_drv_token"));
  await listFiles(client);
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

// const md = "<!-- -->\n```javascript\nconsole.log('hello');\n```\n"

export default function Index() {
  const worker = useRef<Remote<typeof import("../worker")> | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
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
      output = compile(doc)({ arr: ["foo", "bar"] });
    } catch {
      //
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
      };

      connectDB();
    }
  }, []);

  return (
    <Form method="POST" className="flex flex-col gap-8" replace>
      <img src="/logo-dark.png" className="h-24 w-80" />
      <button type="submit" className="btn btn-sm w-fit">
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
