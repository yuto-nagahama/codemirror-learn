import { EditorView } from "codemirror";

export const insertTextCommand = (text: string) => {
  return (view: EditorView) => {
    const transaction = view.state.update({
      changes: {
        from: view.state.selection.main.head,
        insert: text,
      },
    });
    view.dispatch(transaction);

    return true;
  };
};
