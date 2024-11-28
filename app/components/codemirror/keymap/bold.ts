import { EditorView } from "codemirror";

export const commandBold = (view: EditorView) => {
  const range = view.state.selection.main;
  if (
    view.state.sliceDoc(range.from, range.from + 2) == "**" &&
    view.state.sliceDoc(range.to - 2, range.to) == "**"
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
        insert: `**${view.state.sliceDoc(range.from, range.to)}**`,
      },
    });
    view.dispatch(transaction);
  }
  return true;
};
