import { EditorView } from "codemirror";
import { useMemo } from "react";

export const useDragDropImageExtension = () => {
  const imageUpload = (file: File, cb: (url: string) => void) => {
    const id = crypto.randomUUID();
    const formData = new FormData();
    const pos = file.name.lastIndexOf(".");
    const ext = pos === -1 ? "" : file.name.slice(pos + 1);
    const fileName = `${id}.${ext}`;
    formData.set("file", file, fileName);

    fetch(`/api/asset/upload`, {
      body: formData,
      method: "POST",
    }).then(() => {
      cb(`/asset/image/${fileName}`);
    });
  };
  return useMemo(
    () =>
      EditorView.domEventHandlers({
        // 画像ファイルがドラッグ＆ドロップされたときの処理
        // ref: https://developer.mozilla.org/ja/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop#%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E3%81%AE%E5%87%A6%E7%90%86
        drop(event, view) {
          if (!event.dataTransfer) return;

          const insertText = (url: string) => {
            // eventが発生したカーソルの位置を取得する
            const cursorPos = view.posAtCoords({
              x: event.pageX,
              y: event.pageY,
            });
            const insertText = `![](${url})`;
            const transaction = view.state.update({
              changes: {
                from: cursorPos || 0,
                insert: insertText,
              },
            });
            view.dispatch(transaction);
          };

          // DataTransferItemList インターフェイスを使用して、ファイルにアクセスする
          if (event.dataTransfer.items) {
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
              const item = event.dataTransfer.items[i];
              // ドロップしたものがファイルでない場合は拒否する
              if (item.kind === "file") {
                const file = item.getAsFile();
                if (!file) return;

                imageUpload(file, (url) => {
                  insertText(url);
                });
              }
            }
          } else {
            // DataTransfer インターフェイスを使用してファイルにアクセスする
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
              const file = event.dataTransfer.files[i];

              imageUpload(file, (url) => {
                insertText(url);
              });
            }
          }
        },
      }),
    []
  );
};
