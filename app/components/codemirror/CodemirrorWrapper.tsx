import { memo, useEffect, useMemo } from "react";
import { useCodemirror } from "./hooks/useCodemirror";
import EditorToolbar from "./toolbar";

type Props = {
  doc?: string;
  setDoc?: (content: string) => void;
};

export default memo(function CodemirrorWrapper({ doc, setDoc }: Props) {
  const { editor, view } = useCodemirror({ doc, setDoc });

  return (
    <div className="size-full">
      <EditorToolbar view={view} />
      <div ref={editor} className="border" />
    </div>
  );
});
