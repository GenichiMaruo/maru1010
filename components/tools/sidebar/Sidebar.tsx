"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatisticsPanel } from "../StatisticsPanel";
import { FaPlus, FaTimes, FaFileImport } from "react-icons/fa";
import {
  Menu,
  Home,
  Sun,
  Moon,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Globe,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { FileTab } from "@/hooks/useFileManager";
import { SplitLayout, EditorPane } from "@/hooks/useEditorLayout";
// Tiptapスタイルを読み込み
// CSS imports removed - styles are now in globals.css

interface SidebarProps {
  // Layout state
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isResizing: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;

  // Statistics state
  statisticsHeight: number;
  isStatisticsResizing: boolean;
  handleStatisticsResizeStart: (e: React.MouseEvent) => void;

  // File management
  fileTabs: FileTab[];
  activeFileId: string;
  currentEditingFileId: string | null;
  currentEditingFileContent: string;
  activeFile: FileTab | undefined;
  setActiveFileId: (id: string) => void;
  addNewFile: () => void;
  closeFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  exportFile: (file: FileTab, format?: "txt" | "md" | "json") => void;
  instantSave: () => void;
  handleFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLatexExport: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;

  // Split layout management
  splitLayout: SplitLayout;
  activePaneId: string;
  setActivePaneId: (paneId: string) => void;
  assignFileToPane: (paneId: string, fileId: string | null) => void;
  removeFileFromPane: (paneId: string, fileId: string) => void;
  setActiveFileInPane: (paneId: string, fileId: string) => void;
  getAllPanes: () => EditorPane[];

  // Editor and stats
  editor: Editor | null;
  targetLength: number;
  showAdvancedStats: boolean;
  setShowAdvancedStats: (show: boolean) => void;
  isSaving: boolean;
  mounted: boolean;
}

export function Sidebar({
  sidebarWidth,
  sidebarCollapsed,
  setSidebarCollapsed,
  isResizing,
  handleResizeStart,
  statisticsHeight,
  isStatisticsResizing,
  handleStatisticsResizeStart,
  fileTabs,
  activeFileId, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentEditingFileId,
  currentEditingFileContent,
  activeFile,
  setActiveFileId,
  addNewFile,
  closeFile,
  renameFile,
  exportFile,
  instantSave,
  handleFileImport,
  onLatexExport,
  reorderFiles,
  activePaneId,
  assignFileToPane,
  editor,
  targetLength,
  showAdvancedStats,
  setShowAdvancedStats,
  isSaving,
  mounted,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [shouldExpandStats, setShouldExpandStats] = useState(true); // Default to expanded
  const [language, setLanguage] = useState<"en" | "ja">("en"); // 言語状態を追加
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set()); // 複数選択
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null); // ドラッグ中のファイル
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null); // ドラッグオーバー中のファイル
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const fileTabsRef = useRef<HTMLDivElement>(null);

  // 言語切り替え関数
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ja" : "en"));
  };

  // 多言語対応テキスト
  const texts = {
    en: {
      header: "CHAR COUNT PRO",
      files: "FILES",
      statistics: "STATISTICS",
      autoSave: "AUTO-SAVE",
      saving: "Saving...",
      modified: "Modified",
      saved: "Saved",
      last: "Last",
      import: "IMPORT",
      importFile: "Import File",
      export: "EXPORT",
      collapse: "Collapse",
      expand: "Expand",
      toggleTheme: "Toggle Theme",
      home: "Home",
      toggleLanguage: "Toggle Language",
      selectedFiles: "selected",
      deleteSelected: "Delete Selected",
      newWindow: "New Window",
      dragFileToWindow: "Drag file to a window to open",
    },
    ja: {
      header: "CHAR COUNT PRO",
      files: "ファイル",
      statistics: "統計",
      autoSave: "自動保存",
      saving: "保存中...",
      modified: "変更済み",
      saved: "保存済み",
      last: "最終保存",
      import: "インポート",
      importFile: "ファイルを読み込み",
      export: "エクスポート",
      collapse: "折りたたむ",
      expand: "展開する",
      toggleTheme: "テーマ切り替え",
      home: "ホーム",
      toggleLanguage: "言語切り替え",
      selectedFiles: "個選択中",
      deleteSelected: "選択したファイルを削除",
      newWindow: "新しいウィンドウ",
      dragFileToWindow: "ファイルをウィンドウにドラッグして開く",
    },
  };

  const t = texts[language];

  // ファイル選択・操作のハンドラー
  const handleFileSelect = (fileId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + クリックで複数選択切り替え
      setSelectedFiles((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(fileId)) {
          newSelection.delete(fileId);
        } else {
          newSelection.add(fileId);
        }
        return newSelection;
      });
    } else if (event.shiftKey && selectedFiles.size > 0) {
      // Shift + クリックで範囲選択
      const lastSelectedIndex = fileTabs.findIndex((f) =>
        selectedFiles.has(f.id)
      );
      const currentIndex = fileTabs.findIndex((f) => f.id === fileId);
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);

      const newSelection = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSelection.add(fileTabs[i].id);
      }
      setSelectedFiles(newSelection);
    } else {
      // 通常のクリック: 選択状態をクリアしてアクティブファイルを設定
      setSelectedFiles(new Set()); // 選択状態をクリア
      setActiveFileId(fileId);
    }
  };

  // ファイルダブルクリック処理（アクティブペインで開く）
  const handleFileDoubleClick = useCallback(
    (fileId: string) => {
      // アクティブペインが存在する場合はそこに、存在しない場合はメインペインに割り当て
      const targetPaneId = activePaneId || "main";
      assignFileToPane(targetPaneId, fileId);
    },
    [activePaneId, assignFileToPane]
  );

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", fileId);
  };

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFileId(fileId);
  };

  // ドラッグリーブ
  const handleDragLeave = () => {
    setDragOverFileId(null);
  };

  // ドロップ
  const handleDrop = (e: React.DragEvent, targetFileId: string) => {
    e.preventDefault();

    if (draggedFileId && draggedFileId !== targetFileId) {
      const fromIndex = fileTabs.findIndex((f) => f.id === draggedFileId);
      const toIndex = fileTabs.findIndex((f) => f.id === targetFileId);

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderFiles(fromIndex, toIndex);
      }
    }

    setDraggedFileId(null);
    setDragOverFileId(null);
  };

  // ドラッグ終了（ドロップしなかった場合も含む）
  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFileId(null);
  };

  // 複数ファイル削除
  const handleDeleteSelected = useCallback(() => {
    if (selectedFiles.size > 0) {
      selectedFiles.forEach((fileId) => {
        if (fileTabs.length > 1) {
          closeFile(fileId);
        }
      });
      setSelectedFiles(new Set());
    }
  }, [selectedFiles, fileTabs.length, closeFile]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "a" &&
        e.target === document.body
      ) {
        // Ctrl/Cmd + A で全選択
        e.preventDefault();
        setSelectedFiles(new Set(fileTabs.map((f) => f.id)));
      } else if (e.key === "Delete" && selectedFiles.size > 0) {
        // Delete キーで選択したファイルを削除
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        // Escape キーで選択解除
        setSelectedFiles(new Set());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedFiles, fileTabs, handleDeleteSelected]);

  // Calculate available space and determine if statistics area should expand
  useEffect(() => {
    const calculateSpace = () => {
      if (!sidebarRef.current || !headerRef.current || !fileTabsRef.current) {
        return;
      }

      const sidebarHeight = sidebarRef.current.clientHeight;
      const headerHeight = headerRef.current.offsetHeight;
      const fileTabsHeight = fileTabsRef.current.offsetHeight;

      // Calculate actual content height more accurately
      // Statistics panel includes:
      // - Statistics content (~150-200px)
      // - Auto-save section (~60px)
      // - Import section (~50px)
      // - Export section (~80px)
      // - Padding and margins (~50px)
      const estimatedStatsMinHeight = 350; // Reduced to be more permissive

      const availableHeight =
        sidebarHeight - headerHeight - fileTabsHeight - 40; // 40px for padding/borders

      // Only collapse if there's insufficient space
      // Default to expanded unless space is really tight
      setShouldExpandStats(availableHeight >= estimatedStatsMinHeight);
    };

    calculateSpace();

    const resizeObserver = new ResizeObserver(calculateSpace);
    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (sidebarCollapsed) {
    return (
      <div className="flex-shrink-0 w-12 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(false)}
          className="h-8 w-8 p-0 mb-2"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 relative"
      style={{ width: sidebarWidth }}
    >
      {/* サイドバーコンテンツ */}
      <div className="h-full flex flex-col">
        {/* サイドバーヘッダー */}
        <div
          ref={headerRef}
          className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
            {t.header}
          </h3>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300"
                  >
                    <Globe className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.toggleLanguage}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300"
                  >
                    {!mounted ? (
                      <div className="w-3 h-3" />
                    ) : theme === "dark" ? (
                      <Sun className="w-3 h-3" />
                    ) : (
                      <Moon className="w-3 h-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.toggleTheme}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/")}
                    className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300"
                  >
                    <Home className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.home}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(true)}
              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* ファイルリスト */}
        <div ref={fileTabsRef} className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                {t.files}
                {selectedFiles.size > 1 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    ({selectedFiles.size} {t.selectedFiles})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {selectedFiles.size > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="h-5 w-5 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    title={t.deleteSelected}
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addNewFile}
                  className="h-5 w-5 p-0 text-slate-600 dark:text-slate-300"
                >
                  <FaPlus className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>

            {fileTabs.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-all duration-200 group relative ${
                  selectedFiles.has(file.id)
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400"
                    : file.id === currentEditingFileId
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                } ${draggedFileId === file.id ? "opacity-50 scale-95" : ""} ${
                  dragOverFileId === file.id && draggedFileId !== file.id
                    ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-800"
                    : ""
                }`}
                onClick={(e) => handleFileSelect(file.id, e)}
                onDoubleClick={() => handleFileDoubleClick(file.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id)}
                onDragOver={(e) => handleDragOver(e, file.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
                </div>
                <input
                  type="text"
                  value={file.name}
                  onChange={(e) => renameFile(file.id, e.target.value)}
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                  onBlur={() => instantSave()}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                {file.isDirty && (
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                )}
                {fileTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 統計パネル */}
        <div className="group flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 relative">
          {/* 統計パネルリサイザー */}
          {!shouldExpandStats && (
            <div
              className={`statistics-resizer absolute top-0 left-0 right-0 h-2 cursor-row-resize hover:bg-blue-500/20 transition-all duration-200 z-10 flex items-center justify-center ${
                isStatisticsResizing
                  ? "bg-blue-500/30 resizing"
                  : "bg-transparent"
              }`}
              onMouseDown={handleStatisticsResizeStart}
              title="Drag to resize statistics panel"
            >
              <div
                className={`w-8 h-0.5 bg-slate-400 dark:bg-slate-500 rounded transition-opacity duration-200 ${
                  isStatisticsResizing
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50"
                }`}
              />
            </div>
          )}

          {/* 統計パネルコンテンツ */}
          <div
            className="flex flex-col"
            style={{
              height: shouldExpandStats ? "auto" : `${statisticsHeight}px`,
              minHeight: shouldExpandStats ? "400px" : `${statisticsHeight}px`, // Ensure minimum height when expanded
              maxHeight: shouldExpandStats ? "none" : `${statisticsHeight}px`,
            }}
          >
            <div className="flex-shrink-0 p-2 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t.statistics}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShouldExpandStats(!shouldExpandStats)}
                        className="h-4 w-4 p-0 text-slate-600 dark:text-slate-300"
                      >
                        {shouldExpandStats ? (
                          <ChevronUp className="w-2.5 h-2.5" />
                        ) : (
                          <ChevronDown className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {shouldExpandStats ? t.collapse : t.expand} {t.statistics}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* スクロール可能な統計エリア */}
            <div
              className={`statistics-scrollbar flex-1 px-2 pb-2 min-h-0 ${
                shouldExpandStats ? "overflow-visible" : "overflow-y-auto"
              }`}
            >
              <StatisticsPanel
                editor={editor}
                targetLength={targetLength}
                showAdvancedStats={showAdvancedStats}
                onToggleAdvancedStats={() =>
                  setShowAdvancedStats(!showAdvancedStats)
                }
                currentEditingFileContent={currentEditingFileContent}
              />

              {/* 保存状態 */}
              <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.autoSave}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSaving
                        ? "bg-orange-500 animate-pulse"
                        : activeFile?.isDirty
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {isSaving
                      ? t.saving
                      : activeFile?.isDirty
                      ? t.modified
                      : t.saved}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.last}:{" "}
                  {mounted && activeFile?.lastSaved
                    ? activeFile.lastSaved.toLocaleTimeString()
                    : "--:--:--"}
                </div>
              </div>

              {/* インポートセクション */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t.import}
                </div>
                <div>
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileImport}
                    className="hidden"
                    id="file-import"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-6"
                    onClick={() =>
                      document.getElementById("file-import")?.click()
                    }
                  >
                    <FaFileImport className="w-2.5 h-2.5 mr-1" />
                    {t.importFile}
                  </Button>
                </div>
              </div>

              {/* エクスポートセクション */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t.export}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activeFile && exportFile(activeFile, "txt")}
                    className="text-xs h-6"
                    disabled={!activeFile}
                  >
                    .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activeFile && exportFile(activeFile, "md")}
                    className="text-xs h-6"
                    disabled={!activeFile}
                  >
                    .md
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLatexExport}
                  className="w-full text-xs h-6"
                  disabled={!activeFile}
                >
                  LaTeX (.tex)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* サイドバーリサイザー */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
          isResizing ? "bg-blue-500" : "bg-transparent"
        }`}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
