import { useMemo } from "react";
import { EditorView } from "codemirror";

export const useEditorStyle = () => {
  return useMemo(() => {
    return EditorView.theme({
      "&": {
        minHeight: "500px",
      },
      // editorの外枠
      "&.cm-editor": {
        minHeight: "6rem",
        outline: "none", // エディターの枠線を非表示
      },
      // editorの内部
      "&.cm-editor .cm-scroller": {
        fontFamily: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace, 'Segoe UI Emoji'`,
        "-webkit-font-smoothing": "antialiased",
        letterSpacing: "0.02em",
        fontSize: "15px",
        lineHeight: "1.8",
        color: "#000000",
      },
      // 選択範囲の背景色
      ".cm-selectionBackground": {
        backgroundColor: "#036dd626 !important",
      },
      cc: {
        backgroundColor: "gray",
      },
    });
  }, []);
};
