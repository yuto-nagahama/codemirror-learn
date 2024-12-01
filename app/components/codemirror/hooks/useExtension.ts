import { useMemo } from "react";
import { EditorView, keymap, ViewUpdate } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { html } from "@codemirror/lang-html";
import { tags } from "@lezer/highlight";
import { useDragDropImageExtension } from "../drag-drop/image/useDragDropImageExtension";
import { insertMarkCommand } from "../keymap/insertMark";
import { insertTextCommand } from "../keymap/insertText";

type Props = {
  setDoc?: (content: string) => void;
};

const highlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    color: "black",
    fontSize: "1.4em",
    fontWeight: "700",
  },
  {
    tag: tags.heading2,
    color: "black",
    fontSize: "1.3em",
    fontWeight: "700",
  },
  {
    tag: tags.heading3,
    color: "black",
    fontSize: "1.2em",
    fontWeight: "700",
  },
  {
    tag: tags.heading4,
    color: "black",
    fontSize: "1.1em",
    fontWeight: "700",
  },
  { tag: tags.strong, color: "black", fontWeight: "700" }, // 太字
  { tag: tags.quote, color: "#6a737d" }, // 引用
  { tag: tags.emphasis, fontStyle: "italic" }, // 斜体
  { tag: tags.url, textDecoration: "underline" }, // URLに下線をつける
  { tag: tags.strikethrough, textDecoration: "line-through" }, // 打ち消し線（GFM拡張）
  { tag: tags.comment, class: "text-green-700" },
]);

export const useExtension = ({ setDoc }: Props) => {
  const imageDragDrop = useDragDropImageExtension();
  const customKeymap = useMemo(() => {
    return keymap.of([
      {
        key: "Mod-b",
        run: insertMarkCommand("**"),
      },
      {
        key: "Mod-i",
        run: insertMarkCommand("*"),
      },
      {
        key: "Mod--",
        run: insertMarkCommand("~~"),
      },
      {
        key: "Alt-t",
        run: insertTextCommand(`|  |  |\n| -- | -- |\n|  |  |`),
      },
      ...historyKeymap,
    ]);
  }, []);
  const updateListener = useMemo(() => {
    return EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        // エディタのテキストが更新されるたびにdocを更新する
        if (typeof setDoc === "function") {
          setDoc(update.state.doc.toString());
        }
      }
    });
  }, [setDoc]);
  const markdownExtension = useMemo(() => {
    return markdown({
      base: markdownLanguage,
      completeHTMLTags: false,
      codeLanguages: languages,
    });
  }, []);

  return useMemo(() => {
    return [
      syntaxHighlighting(highlightStyle),
      updateListener,
      customKeymap,
      markdownExtension,
      imageDragDrop,
      javascript(),
      php(),
      html(),
      history(),
    ];
  }, [customKeymap, updateListener, markdownExtension, imageDragDrop]);
};
