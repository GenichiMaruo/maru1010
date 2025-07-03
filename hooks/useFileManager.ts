import { useState, useCallback } from "react";

export interface FileTab {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  lastSaved: Date;
}

export const useFileManager = () => {
  const [fileTabs, setFileTabs] = useState<FileTab[]>([
    {
      id: "1",
      name: "Untitled",
      content: "",
      isDirty: false,
      lastSaved: new Date(),
    },
  ]);
  const [activeFileId, setActiveFileId] = useState("1");
  // const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 現在のアクティブファイル
  const activeFile =
    fileTabs.find((file) => file.id === activeFileId) || fileTabs[0];

  // ファイル操作関数
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFileTabs((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, content, isDirty: true } : file
      )
    );
  }, []);

  const addNewFile = useCallback(() => {
    const newId = Date.now().toString();
    const newFile: FileTab = {
      id: newId,
      name: `Untitled-${newId.slice(-4)}`,
      content: "",
      isDirty: false,
      lastSaved: new Date(),
    };
    setFileTabs((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  }, []);

  const closeFile = useCallback(
    (fileId: string) => {
      setFileTabs((prev) => {
        const filtered = prev.filter((file) => file.id !== fileId);
        if (filtered.length === 0) {
          // 最後のファイルを閉じる場合、新しいファイルを作成
          const newFile: FileTab = {
            id: Date.now().toString(),
            name: "Untitled",
            content: "",
            isDirty: false,
            lastSaved: new Date(),
          };
          return [newFile];
        }
        return filtered;
      });

      if (activeFileId === fileId) {
        const remainingFiles = fileTabs.filter((file) => file.id !== fileId);
        if (remainingFiles.length > 0) {
          setActiveFileId(remainingFiles[0].id);
        }
      }
    },
    [activeFileId, fileTabs]
  );

  const renameFile = useCallback((fileId: string, newName: string) => {
    setFileTabs((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  }, []);

  // 自動保存機能
  const saveFile = useCallback(
    (fileId: string) => {
      const file = fileTabs.find((f) => f.id === fileId);
      if (file) {
        localStorage.setItem(
          `char-count-pro-file-${fileId}`,
          JSON.stringify({
            name: file.name,
            content: file.content,
            lastSaved: new Date().toISOString(),
          })
        );

        setFileTabs((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, isDirty: false, lastSaved: new Date() }
              : f
          )
        );
      }
    },
    [fileTabs]
  );

  // 即時保存
  const instantSave = useCallback(
    (fileId: string) => {
      saveFile(fileId);
    },
    [saveFile]
  );

  // ファイルのエクスポート
  const exportFile = useCallback(
    (file: FileTab, format: "txt" | "md" | "json" = "txt") => {
      let content = "";
      let mimeType = "";
      let extension = "";

      switch (format) {
        case "txt":
          content = file.content;
          mimeType = "text/plain";
          extension = "txt";
          break;
        case "md":
          // Convert HTML to basic Markdown
          content = file.content
            .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
            .replace(/<em>(.*?)<\/em>/g, "*$1*")
            .replace(/<u>(.*?)<\/u>/g, "__$1__")
            .replace(/<s>(.*?)<\/s>/g, "~~$1~~")
            .replace(/<h1>(.*?)<\/h1>/g, "# $1")
            .replace(/<h2>(.*?)<\/h2>/g, "## $1")
            .replace(/<h3>(.*?)<\/h3>/g, "### $1")
            .replace(/<p>(.*?)<\/p>/g, "$1\n\n")
            .replace(/<br\s*\/?>/g, "\n")
            .replace(/<[^>]*>/g, "");
          mimeType = "text/markdown";
          extension = "md";
          break;
        case "json":
          content = JSON.stringify(
            {
              name: file.name,
              content: file.content,
              lastSaved: file.lastSaved.toISOString(),
              exportDate: new Date().toISOString(),
            },
            null,
            2
          );
          mimeType = "application/json";
          extension = "json";
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  // ファイルのインポート
  const importFile = useCallback(
    (file: File, targetFileId: string) => {
      const newName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      renameFile(targetFileId, newName);

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;

          if (file.type === "application/json") {
            try {
              const data = JSON.parse(content);
              resolve(data.content || data.html || content);
            } catch {
              resolve(content);
            }
          } else {
            resolve(content);
          }
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsText(file);
      });
    },
    [renameFile]
  );

  return {
    fileTabs,
    activeFileId,
    activeFile,
    setActiveFileId,
    updateFileContent,
    addNewFile,
    closeFile,
    renameFile,
    saveFile,
    instantSave,
    exportFile,
    importFile,
  };
};
