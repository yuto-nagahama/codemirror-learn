import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "codemirror";
import { EditorState, Text } from "@codemirror/state";
import { useExtension } from "./useExtension";

type UseCodemirrorProps = {
  doc?: string | Text;
  setDoc?: (content: string) => void;
};

export const useCodemirror = ({ doc, setDoc }: UseCodemirrorProps) => {
  const editor = useRef(null); // EditorViewの親要素のref
  const [container, setContainer] = useState<HTMLDivElement>();
  const [view, setView] = useState<EditorView>();
  const extensions = useExtension({ setDoc });
  const insertTextToEditor = useCallback(
    (mark: string) => {
      if (!view) return;

      const range = view.state.selection.main;

      if (
        view.state.sliceDoc(range.from, range.from + 2) == mark &&
        view.state.sliceDoc(range.to - 2, range.to) == mark
      ) {
        const transaction = view.state.update({
          changes: {
            from: range.from,
            to: range.to,
            insert: view.state.sliceDoc(range.from + 2, range.to - 2),
          },
        });
        view.dispatch(transaction);
      } else {
        const transaction = view.state.update({
          changes: {
            from: range.from,
            to: range.to,
            insert: `${mark}${view.state.sliceDoc(
              range.from,
              range.to
            )}${mark}`,
          },
        });
        view.dispatch(transaction);
      }
    },
    [view]
  );

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
    insertTextToEditor,
  };
};
