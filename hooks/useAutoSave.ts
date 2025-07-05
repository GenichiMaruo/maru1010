import { useEffect } from "react";
import { FileTab } from "./useFileManager";

export function useAutoSave(fileTabs: FileTab[], activeFileId: string) {
  // ページ閉じる前やリロード前に確実に保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 即座に保存（遅延なし）
      if (fileTabs.length > 0) {
        try {
          localStorage.setItem(
            "char-count-pro-files",
            JSON.stringify(fileTabs)
          );
          localStorage.setItem("char-count-pro-active-file", activeFileId);
        } catch (error) {
          console.warn("Failed to save on beforeunload:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [fileTabs, activeFileId]);
}
