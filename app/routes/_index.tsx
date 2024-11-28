import { useEffect, useState } from "react";
import markdownit from "markdown-it";
import hljs from "highlight.js";
import CodemirrorWrapper from "~/components/codemirror/CodemirrorWrapper";

const markdown = markdownit({
  html: true,
  linkify: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }

    return ""; // use external default escaping
  },
});

export default function Index() {
  const [doc, setDoc] = useState(
    "<!-- -->\n```javascript\nconsole.log('hello');\n```\n"
  );
  const [preview, setPreview] = useState("");

  useEffect(() => {
    setPreview(markdown.render(doc));
  }, [doc]);

  return (
    <div className="flex flex-col gap-4">
      <CodemirrorWrapper doc={doc} setDoc={setDoc} />
      <div dangerouslySetInnerHTML={{ __html: preview }} className="p-8"></div>
    </div>
  );
}
