import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";

export interface FileTab {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  lastSaved: Date;
}

export interface EditorWindow {
  id: string;
  fileId: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

// ローカルストレージのキー
const STORAGE_KEYS = {
  FILES: "char-count-pro-files",
  ACTIVE_FILE: "char-count-pro-active-file",
};

// ローカルストレージからファイルを復元
const loadFilesFromStorage = (): { files: FileTab[]; activeFileId: string } => {
  // SSRとHydration問題を防ぐため、windowオブジェクトの存在を確認
  if (typeof window === "undefined") {
    const defaultFile: FileTab = {
      id: "1",
      name: "Untitled",
      content: "",
      isDirty: false,
      lastSaved: new Date(0), // 固定日時でHydration安全
    };
    return { files: [defaultFile], activeFileId: "1" };
  }

  try {
    const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
    const savedActiveFileId = localStorage.getItem(STORAGE_KEYS.ACTIVE_FILE);

    if (savedFiles) {
      const files = JSON.parse(savedFiles).map(
        (file: Omit<FileTab, "lastSaved"> & { lastSaved: string }) => ({
          ...file,
          lastSaved: new Date(file.lastSaved),
        })
      );

      const activeFileId =
        savedActiveFileId &&
        files.find((f: FileTab) => f.id === savedActiveFileId)
          ? savedActiveFileId
          : files[0]?.id || "1";

      return { files, activeFileId };
    }
  } catch (error) {
    console.warn("Failed to load files from localStorage:", error);
  }

  // デフォルトのファイル
  const defaultFile: FileTab = {
    id: "1",
    name: "Untitled",
    content: "",
    isDirty: false,
    lastSaved: new Date(0), // 固定日時でHydration安全
  };

  return { files: [defaultFile], activeFileId: "1" };
};

// ローカルストレージにファイルを保存
const saveFilesToStorage = (files: FileTab[], activeFileId: string) => {
  // SSRとHydration問題を防ぐため、windowオブジェクトの存在を確認
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_FILE, activeFileId);
  } catch (error) {
    console.warn("Failed to save files to localStorage:", error);
  }
};

export const useFileManager = () => {
  // デフォルトファイルで初期化（SSR対応）
  const defaultFile: FileTab = {
    id: "1",
    name: "Untitled",
    content: "",
    isDirty: false,
    lastSaved: new Date(0), // 固定日時でHydration安全
  };

  // 初期状態（SSR安全）
  const [fileTabs, setFileTabs] = useState<FileTab[]>([defaultFile]);
  const [activeFileId, setActiveFileId] = useState("1");
  const [editorWindows, setEditorWindows] = useState<EditorWindow[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoredFromStorage, setIsRestoredFromStorage] = useState(false);

  // クライアントサイドでマウント後に即座にローカルストレージから復元
  // useLayoutEffectを使用して同期的に実行し、より高速な復元を実現
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const { files, activeFileId } = loadFilesFromStorage();
      setFileTabs(files);
      setActiveFileId(activeFileId);
      setIsInitialized(true);
      setIsRestoredFromStorage(true);
    }
  }, [isInitialized]);

  // ファイルの状態が変更されたときに自動保存
  useEffect(() => {
    // 初期化完了前や初回レンダリング時のスキップ
    if (!isInitialized || fileTabs.length === 0) return;

    // dirtyなファイルが存在する場合のみ保存処理を実行
    const hasDirtyFiles = fileTabs.some((file) => file.isDirty);
    if (!hasDirtyFiles) return;

    // 保存中状態に設定
    setIsSaving(true);

    // 少し遅延して保存（頻繁な保存を防ぐ）
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        saveFilesToStorage(fileTabs, activeFileId);
        // 保存成功時にすべてのファイルのisDirtyをfalseに更新
        setFileTabs((prev) =>
          prev.map((file) => ({
            ...file,
            isDirty: false,
            lastSaved: new Date(),
          }))
        );
      } catch (error) {
        console.warn("Failed to save files:", error);
      } finally {
        setIsSaving(false);
      }
    }, 200); // 200ms（0.2秒）後に保存（より高速化）

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [fileTabs, activeFileId, isInitialized]);

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
      lastSaved: isInitialized ? new Date() : new Date(0),
    };
    setFileTabs((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  }, [isInitialized]);

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
            lastSaved: isInitialized ? new Date() : new Date(0),
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
    [activeFileId, fileTabs, isInitialized]
  );

  const renameFile = useCallback((fileId: string, newName: string) => {
    setFileTabs((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  }, []);

  // 復元フラグをリセットする関数
  const resetRestoredFlag = useCallback(() => {
    setIsRestoredFromStorage(false);
  }, []);
  const saveAllFiles = useCallback(() => {
    if (!isInitialized) return;

    try {
      saveFilesToStorage(fileTabs, activeFileId);
      setFileTabs((prev) =>
        prev.map((file) => ({
          ...file,
          isDirty: false,
          lastSaved: new Date(),
        }))
      );
    } catch (error) {
      console.warn("Failed to save files:", error);
    }
  }, [fileTabs, activeFileId, isInitialized]);

  // 即時保存（手動保存用）
  const instantSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setIsSaving(true);
    saveAllFiles();
    setIsSaving(false);
  }, [saveAllFiles]);

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

  // ファイルの順序変更
  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFileTabs((prev) => {
      const newTabs = [...prev];
      const [movedFile] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedFile);
      return newTabs;
    });
  }, []);

  // ウィンドウ管理関数
  const createWindow = useCallback(() => {
    const newWindow: EditorWindow = {
      id: Date.now().toString(),
      fileId: null,
      position: {
        x: 50 + editorWindows.length * 30,
        y: 50 + editorWindows.length * 30,
      },
      size: { width: 600, height: 400 },
      isMinimized: false,
    };
    setEditorWindows((prev) => [...prev, newWindow]);
    return newWindow.id;
  }, [editorWindows.length]);

  const closeWindow = useCallback((windowId: string) => {
    setEditorWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const assignFileToWindow = useCallback((windowId: string, fileId: string) => {
    setEditorWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, fileId } : w))
    );
  }, []);

  const updateWindowPosition = useCallback(
    (windowId: string, position: { x: number; y: number }) => {
      setEditorWindows((prev) =>
        prev.map((w) => (w.id === windowId ? { ...w, position } : w))
      );
    },
    []
  );

  const updateWindowSize = useCallback(
    (windowId: string, size: { width: number; height: number }) => {
      setEditorWindows((prev) =>
        prev.map((w) => (w.id === windowId ? { ...w, size } : w))
      );
    },
    []
  );

  const toggleWindowMinimize = useCallback((windowId: string) => {
    setEditorWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  }, []);

  return {
    fileTabs,
    activeFileId,
    activeFile,
    setActiveFileId,
    updateFileContent,
    addNewFile,
    closeFile,
    renameFile,
    saveAllFiles,
    instantSave,
    exportFile,
    importFile,
    isSaving,
    isRestoredFromStorage,
    resetRestoredFlag,
    reorderFiles,
    editorWindows,
    createWindow,
    closeWindow,
    assignFileToWindow,
    updateWindowPosition,
    updateWindowSize,
    toggleWindowMinimize,
  };
};
