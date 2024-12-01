import { EditorView } from "codemirror";
import { insertMarkCommand } from "../keymap/insertMark";
import { insertTextCommand } from "../keymap/insertText";
import {
  BoldIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  ItalicIcon,
  StrikethroughIcon,
} from "@heroicons/react/24/outline";

type Props = {
  view?: EditorView;
};

export default function EditorToolbar({ view }: Props) {
  return (
    <div className="flex">
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertTextCommand("# ")(view)}
      >
        <H1Icon className="size-5" />
      </button>
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertTextCommand("## ")(view)}
      >
        <H2Icon className="size-5" />
      </button>
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertTextCommand("### ")(view)}
      >
        <H3Icon className="size-5" />
      </button>
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertMarkCommand("**")(view)}
      >
        <BoldIcon className="size-5" />
      </button>
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertMarkCommand("*")(view)}
      >
        <ItalicIcon className="size-5" />
      </button>
      <button
        type="button"
        className="btn btn-sm rounded-none"
        onClick={() => view && insertMarkCommand("~~")(view)}
      >
        <StrikethroughIcon className="size-5" />
      </button>
    </div>
  );
}
