"use client";

import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { FileTab } from "@/hooks/useFileManager";

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
  activeFile: FileTab | undefined;
  setActiveFileId: (id: string) => void;
  addNewFile: () => void;
  closeFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  exportFile: (file: FileTab, format?: "txt" | "md" | "json") => void;
  instantSave: () => void;
  handleFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLatexExport: () => void;

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
  activeFileId,
  activeFile,
  setActiveFileId,
  addNewFile,
  closeFile,
  renameFile,
  exportFile,
  instantSave,
  handleFileImport,
  onLatexExport,
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const fileTabsRef = useRef<HTMLDivElement>(null);

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

      // Debug logging (remove in production)
      console.log("Sidebar height calc:", {
        sidebarHeight,
        headerHeight,
        fileTabsHeight,
        availableHeight,
        estimatedStatsMinHeight,
        shouldExpand: availableHeight >= estimatedStatsMinHeight,
      });

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
            CHAR COUNT PRO
          </h3>
          <div className="flex items-center gap-1">
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
                <TooltipContent>Toggle Theme</TooltipContent>
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
                <TooltipContent>Home</TooltipContent>
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
                FILES
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={addNewFile}
                className="h-5 w-5 p-0 text-slate-600 dark:text-slate-300"
              >
                <FaPlus className="w-2.5 h-2.5" />
              </Button>
            </div>

            {fileTabs.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors group ${
                  file.id === activeFileId
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
                onClick={() => setActiveFileId(file.id)}
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
                  STATISTICS
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
                      {shouldExpandStats ? "Collapse" : "Expand"} Statistics
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
                activeFileContent={activeFile?.content}
              />

              {/* 保存状態 */}
              <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  AUTO-SAVE
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
                      ? "Saving..."
                      : activeFile?.isDirty
                      ? "Modified"
                      : "Saved"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Last:{" "}
                  {mounted && activeFile?.lastSaved
                    ? activeFile.lastSaved.toLocaleTimeString()
                    : "--:--:--"}
                </div>
              </div>

              {/* インポートセクション */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  IMPORT
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
                    Import File
                  </Button>
                </div>
              </div>

              {/* エクスポートセクション */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  EXPORT
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
