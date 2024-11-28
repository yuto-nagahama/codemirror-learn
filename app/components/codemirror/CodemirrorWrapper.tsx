import { memo } from "react";
import { useCodemirror } from "./hooks/useCodemirror";
import { Text } from "@codemirror/state";
import EditorToolbar from "./toolbar";

type Props = {
  doc?: string | Text;
  setDoc?: (content: string) => void;
};

export default memo(function CodemirrorWrapper({ doc, setDoc }: Props) {
  const { editor, view } = useCodemirror({ doc, setDoc });

  return (
    <div className="p-8">
      <EditorToolbar view={view} />
      <div ref={editor} className="border" />
    </div>
  );
});
