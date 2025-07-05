import { useEffect, useLayoutEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { FileTab } from "./useFileManager";

export function useEditorSync(
  editor: Editor | null,
  activeFile: FileTab | undefined,
  activeFileId: string,
  updateFileContent: (id: string, content: string) => void,
  isRestoredFromStorage: boolean,
  resetRestoredFlag: () => void
) {
  // エディター初期化時にアクティブファイルの内容を設定
  useEffect(() => {
    if (editor && activeFile) {
      // エディターが作成され、アクティブファイルが存在する場合は内容を設定
      const currentContent = editor.getHTML();
      if (currentContent !== activeFile.content) {
        editor.commands.setContent(activeFile.content, false);
      }
    }
  }, [editor, activeFile]); // エディターまたはアクティブファイルが変更された時に実行

  // ローカルストレージから復元時の即座反映（同期的実行）
  useLayoutEffect(() => {
    if (editor && activeFile && isRestoredFromStorage) {
      // 復元時は同期的に即座にエディター内容を設定
      editor.commands.setContent(activeFile.content, false);
      // フラグをリセットして一度だけ実行されるようにする
      resetRestoredFlag();
    }
  }, [editor, activeFile, isRestoredFromStorage, resetRestoredFlag]);

  // アクティブファイル切り替え時にエディター内容を更新
  // タイマーを使用して遅延更新し、入力処理を妨げないようにする
  const previousFileIdRef = useRef<string>(activeFileId);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editor && activeFile) {
      const isFileChanged = previousFileIdRef.current !== activeFileId;

      if (isFileChanged) {
        // 前のタイマーをクリア
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        // 少し遅延してから内容を更新（入力処理を妨げないため）
        updateTimeoutRef.current = setTimeout(() => {
          if (editor && activeFile) {
            const currentContent = editor.getHTML();
            const isContentDifferent = currentContent !== activeFile.content;

            if (isContentDifferent) {
              editor.commands.setContent(activeFile.content, false);
            }
          }
        }, 100); // 100ms遅延

        previousFileIdRef.current = activeFileId;
      }
    }

    // クリーンアップ
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [editor, activeFile, activeFileId]);

  // エディター更新時のコンテンツ同期
  const handleEditorUpdate = (editor: Editor) => {
    const content = editor.getHTML();
    updateFileContent(activeFileId, content);
  };

  return {
    handleEditorUpdate,
  };
}
