import { useEffect, useRef, useState } from "react";
import { EditorView } from "codemirror";
import { EditorState, Text } from "@codemirror/state";
import { useExtension } from "./useExtension";

type UseCodemirrorProps = {
  doc?: string;
  setDoc?: (content: string) => void;
};

export const useCodemirror = ({ doc, setDoc }: UseCodemirrorProps) => {
  const editor = useRef(null); // EditorViewの親要素のref
  const [container, setContainer] = useState<HTMLDivElement>();
  const [view, setView] = useState<EditorView>();
  const extensions = useExtension({ setDoc });

  // editorのrefをcontainerに設定する
  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [setContainer]);

  // viewを初期化する
  useEffect(() => {
    if (!view && container) {
      const state = EditorState.create({
        doc,
        extensions,
      });
      const viewCurrent = new EditorView({
        state,
        parent: container,
      });
      setView(viewCurrent);
    }
  }, [doc, view, container, extensions]);

  return {
    editor,
    view,
  };
};
