"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaEraser,
  FaTimes,
  FaPlus,
  FaFileImport,
  FaExpandArrowsAlt,
} from "react-icons/fa";
import {
  MdOutlineSubdirectoryArrowLeft,
  MdOutlineArrowDownward,
} from "react-icons/md";
import {
  Scissors,
  Type,
  Menu,
  Home,
  Sun,
  Moon,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom hooks and utilities
import { useFileManager } from "@/hooks/useFileManager";
import { useEditorOperations } from "@/hooks/useEditorOperations";
import { calculateTextStats } from "@/utils/statsUtils";
import { StatisticsPanel } from "./StatisticsPanel";

// TypeScript module augmentation for Tiptap commands
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

// Custom FontSize extension for Tiptap
const FontSizeExtension = Extension.create<{
  types?: string[];
  sizes?: string[];
}>({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
      sizes: ["12", "14", "16", "18", "20", "24"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types ?? [],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace("px", ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain, state }) => {
          // 選択範囲がある場合のみフォントサイズを適用
          const { from, to } = state.selection;
          if (from === to) {
            // 選択範囲がない場合は何もしない
            return false;
          }
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain, state }) => {
          // 選択範囲がある場合のみフォントサイズを解除
          const { from, to } = state.selection;
          if (from === to) {
            // 選択範囲がない場合は何もしない
            return false;
          }
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// Visibility extension for special characters
const VisibilityExtension = Extension.create<{
  showParagraphMarkers: boolean;
  showNewlineMarkers: boolean;
  showFullWidthSpaces: boolean;
}>({
  name: "visibility",
  addOptions() {
    return {
      showParagraphMarkers: false,
      showNewlineMarkers: false,
      showFullWidthSpaces: false,
    };
  },
  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin({
        key: new PluginKey("visibility"),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              // 全角スペースの強調表示
              if (options.showFullWidthSpaces && node.isText && node.text) {
                const text = node.text;
                let match;
                const regex = /　/g;
                while ((match = regex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + 1;
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: "full-width-space-highlight",
                    })
                  );
                }
              }

              // 改行マーカー（hardBreak と段落の終わり）
              if (options.showNewlineMarkers) {
                // hardBreak（Shift+Enter）の場合
                if (node.type.name === "hardBreak") {
                  decorations.push(
                    Decoration.widget(
                      pos,
                      () => {
                        const markerElement = document.createElement("span");
                        markerElement.className = "hard-break-marker";
                        markerElement.textContent = "↲";
                        return markerElement;
                      },
                      {
                        side: -1,
                        marks: [],
                        key: `hardbreak-marker-${pos}`,
                      }
                    )
                  );
                }

                // 段落の終わり（通常のEnter）の場合
                if (node.type.name === "paragraph" && node.content.size > 0) {
                  const endPos = pos + node.nodeSize - 1;
                  decorations.push(
                    Decoration.widget(
                      endPos,
                      () => {
                        const markerElement = document.createElement("span");
                        markerElement.className = "paragraph-end-marker";
                        markerElement.textContent = "↲";
                        return markerElement;
                      },
                      {
                        side: 1,
                        marks: [],
                        key: `paragraph-end-marker-${endPos}`,
                      }
                    )
                  );
                }
              }

              // 段落マーカー
              if (
                options.showParagraphMarkers &&
                node.type.name === "paragraph" &&
                node.content.size === 0
              ) {
                decorations.push(
                  Decoration.widget(
                    pos + 1,
                    () => {
                      const markerElement = document.createElement("span");
                      markerElement.className = "paragraph-marker";
                      markerElement.textContent = "¶";
                      return markerElement;
                    },
                    {
                      side: -1,
                      marks: [],
                      key: `paragraph-marker-${pos}`,
                    }
                  )
                );
              }

              return true;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export default function CharCountProEditor() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const showParagraphMarkers = false;
  const [showNewlineMarkers, setShowNewlineMarkers] = useState(false);
  const [showFullWidthSpaces, setShowFullWidthSpaces] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState("16");
  const [targetLength, setTargetLength] = useState<number>(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // VS Code風レイアウト管理
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // UI状態管理
  const [selectedLanguage, setSelectedLanguage] =
    useState("generic_block_line");
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isTextTransformVisible, setIsTextTransformVisible] = useState(false);

  // カスタムフックの使用
  const fileManager = useFileManager();
  const {
    fileTabs,
    activeFileId,
    activeFile,
    setActiveFileId,
    updateFileContent,
    addNewFile,
    closeFile,
    renameFile,
    exportFile,
    instantSave,
  } = fileManager;

  // エディター設定（可視化機能を追加）
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Underline,
      Strike,
      FontSizeExtension,
      VisibilityExtension.configure({
        showParagraphMarkers: showParagraphMarkers,
        showNewlineMarkers: showNewlineMarkers,
        showFullWidthSpaces: showFullWidthSpaces,
      }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        style: `line-height: 1.6; padding: 2rem; min-height: calc(100vh - 200px);`,
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateFileContent(activeFileId, content);
    },
    immediatelyRender: false,
  });

  // エディター操作フック（エディター作成後）
  const editorOperations = useEditorOperations(editor);

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

  // エディター更新時に可視化設定を更新
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions.forEach((extension) => {
        if (extension.name === "visibility") {
          // 型安全な方法でオプションを更新
          const visibilityExtension = extension as unknown as {
            options: {
              showParagraphMarkers: boolean;
              showNewlineMarkers: boolean;
              showFullWidthSpaces: boolean;
            };
          };
          visibilityExtension.options.showParagraphMarkers =
            showParagraphMarkers;
          visibilityExtension.options.showNewlineMarkers = showNewlineMarkers;
          visibilityExtension.options.showFullWidthSpaces = showFullWidthSpaces;
        }
      });
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, showParagraphMarkers, showNewlineMarkers, showFullWidthSpaces]);

  // VS Code風サイドバーリサイザー
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  // ファイルインポート処理
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        updateFileContent(activeFileId, content);
        const newName = file.name.replace(/\.[^/.]+$/, "");
        renameFile(activeFileId, newName);
      };
      reader.readAsText(file);
    }
  };

  // 基本統計計算
  const stats = editor
    ? calculateTextStats(editor.getText())
    : {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        lines: 0,
        bytes: 0,
        readingTime: 0,
        syllables: 0,
        readabilityScore: 0,
      };

  const targetProgress =
    targetLength > 0 ? (stats.characters / targetLength) * 100 : 0;

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-900">
      {/* VS Code風サイドバー */}
      {!sidebarCollapsed && (
        <div
          className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 relative"
          style={{ width: sidebarWidth }}
        >
          {/* サイドバーコンテンツ */}
          <div className="h-full flex flex-col">
            {/* サイドバーヘッダー */}
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                EXPLORER
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
                        {theme === "dark" ? (
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
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
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
                      onBlur={() => instantSave(file.id)}
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
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-2">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                STATISTICS
              </div>
              <StatisticsPanel
                editor={editor}
                targetLength={targetLength}
                showAdvancedStats={showAdvancedStats}
                onToggleAdvancedStats={() =>
                  setShowAdvancedStats(!showAdvancedStats)
                }
              />

              {/* エクスポートセクション */}
              <div className="mt-4 space-y-1.5">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  EXPORT
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportFile(activeFile, "txt")}
                    className="text-xs h-6"
                  >
                    .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportFile(activeFile, "md")}
                    className="text-xs h-6"
                  >
                    .md
                  </Button>
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
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* サイドバーリサイザー */}
          <div
            ref={resizeRef}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
              isResizing ? "bg-blue-500" : "bg-transparent"
            }`}
            onMouseDown={handleResizeStart}
          />
        </div>
      )}

      {/* 折りたたみ時の展開ボタン */}
      {sidebarCollapsed && (
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
      )}

      {/* メインエディター領域 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {/* VS Code風ファイルタブバー */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 min-h-[35px]">
          <div className="flex overflow-x-auto">
            {fileTabs.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-700 cursor-pointer text-sm transition-colors group min-w-0 ${
                  file.id === activeFileId
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}
                onClick={() => setActiveFileId(file.id)}
              >
                <div className="w-3 h-3 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
                </div>
                <span className="truncate max-w-[120px]">{file.name}</span>
                {file.isDirty && (
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                )}
                {fileTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1 flex-shrink-0"
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={addNewFile}
            className="h-6 w-6 p-0 ml-2 text-slate-600 dark:text-slate-300"
          >
            <FaPlus className="w-3 h-3" />
          </Button>
        </div>

        {/* VS Code風ツールバー */}
        <div className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50">
          {/* 左側: 編集ツール */}
          <div className="flex items-center gap-1">
            {/* テキスト装飾 */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("bold")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaBold className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold (Ctrl+B)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("italic")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaItalic className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic (Ctrl+I)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("underline")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaUnderline className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Underline (Ctrl+U)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleStrike().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("strike")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaStrikethrough className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Strikethrough</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* リスト */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("bulletList")
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaListUl className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bullet List</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("orderedList")
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaListOl className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Numbered List</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* 表示設定 */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowFullWidthSpaces(!showFullWidthSpaces)
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        showFullWidthSpaces
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaExpandArrowsAlt className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show Full-width Spaces</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewlineMarkers(!showNewlineMarkers)}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        showNewlineMarkers
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <MdOutlineSubdirectoryArrowLeft className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show Line Breaks</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* テキスト変換（新しいフックから使用） */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsTextTransformVisible(!isTextTransformVisible)
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        isTextTransformVisible
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Type className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Text Transform</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // シンプルなホワイトスペース削除
                        if (editor) {
                          const content = editor.getText();
                          const cleaned = content.replace(/\s+/g, " ").trim();
                          editor.commands.setContent(cleaned);
                        }
                      }}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Scissors className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Whitespace</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={editorOperations.handleRemoveNewlines}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MdOutlineArrowDownward className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Line Breaks</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={editorOperations.handleClearFormatting}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FaEraser className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear Formatting</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* 中央: フォントサイズ */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={currentFontSize}
                      onValueChange={(value) => {
                        setCurrentFontSize(value);
                        // 選択範囲がある場合のみフォントサイズを適用
                        if (editor) {
                          const { from, to } = editor.state.selection;
                          if (from !== to) {
                            editor.chain().focus().setFontSize(value).run();
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-20 h-6 text-xs bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                        <SelectItem value="20">20px</SelectItem>
                        <SelectItem value="24">24px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Font Size (Select text first)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 右側: 統計とターゲット */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Target:
              </span>
              <div className="relative">
                <input
                  type="number"
                  value={targetLength || ""}
                  onChange={(e) => setTargetLength(Number(e.target.value) || 0)}
                  className="w-20 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="999999"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  chars
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {stats.characters.toLocaleString()} chars
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {stats.words.toLocaleString()} words
              </span>
              {targetLength > 0 && (
                <span
                  className={`font-medium ${
                    targetProgress >= 100
                      ? "text-green-600 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {Math.round(targetProgress)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 検索・置換パネル */}
        {isSearchVisible && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 max-w-2xl">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    editorOperations.handleSearch(searchTerm)
                  }
                />
                <input
                  type="text"
                  placeholder="Replace..."
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    editorOperations.handleReplace(searchTerm, replaceTerm)
                  }
                />
              </div>
              <Button
                size="sm"
                onClick={() => editorOperations.handleSearch(searchTerm)}
                className="h-7"
              >
                Find
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  editorOperations.handleReplace(searchTerm, replaceTerm)
                }
                className="h-7"
              >
                Replace All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchVisible(false)}
                className="h-7 w-7 p-0"
              >
                <FaTimes className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* テキスト変換パネル */}
        {isTextTransformVisible && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 max-w-4xl">
              {/* ケース変換 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Case:
                </span>
                <Button
                  size="sm"
                  onClick={editorOperations.handleConvertToCamelCase}
                  className="h-6 px-2 text-xs"
                >
                  camelCase
                </Button>
                <Button
                  size="sm"
                  onClick={editorOperations.handleConvertToPascalCase}
                  className="h-6 px-2 text-xs"
                >
                  PascalCase
                </Button>
                <Button
                  size="sm"
                  onClick={editorOperations.handleConvertToSnakeCase}
                  className="h-6 px-2 text-xs"
                >
                  snake_case
                </Button>
                <Button
                  size="sm"
                  onClick={editorOperations.handleConvertToKebabCase}
                  className="h-6 px-2 text-xs"
                >
                  kebab-case
                </Button>
              </div>

              {/* 句読点変換 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Punctuation:
                </span>
                <Button
                  size="sm"
                  onClick={editorOperations.handleJpToEnPunctuation}
                  className="h-6 px-2 text-xs"
                >
                  JP→EN
                </Button>
                <Button
                  size="sm"
                  onClick={editorOperations.handleEnToJpPunctuation}
                  className="h-6 px-2 text-xs"
                >
                  EN→JP
                </Button>
              </div>

              {/* コメント削除 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Comments:
                </span>
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger className="w-24 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic_block_line">JS/C++</SelectItem>
                    <SelectItem value="hash_comments">Python</SelectItem>
                    <SelectItem value="html_comments">HTML</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() =>
                    editorOperations.handleRemoveComments(selectedLanguage)
                  }
                  className="h-6 px-2 text-xs"
                >
                  Remove
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTextTransformVisible(false)}
                className="h-6 w-6 p-0 ml-auto"
              >
                <FaTimes className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* エディター */}
        <div className="flex-1 overflow-hidden">
          <EditorContent
            editor={editor}
            className="h-full overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* CSS for special character highlighting and list styles */}
      <style jsx global>{`
        /* TipTapエディターのスタイル */
        .tiptap-editor {
          height: 100%;
          outline: none;
          background-color: white;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
          font-size: 16px; /* デフォルトフォントサイズを固定 */
        }

        .dark .tiptap-editor {
          background-color: #0f172a;
          color: #f8fafc;
        }

        /* 段落のスペース処理を確実に */
        .tiptap-editor p {
          white-space: pre-wrap;
          margin: 0.75em 0;
          line-height: inherit;
        }

        .tiptap-editor p:first-child {
          margin-top: 0;
        }

        .tiptap-editor p:last-child {
          margin-bottom: 0;
        }

        /* リスト処理 */
        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5rem;
          margin: 0.75em 0;
        }

        .tiptap-editor li {
          margin: 0.25em 0;
        }

        /* その他の要素 */
        .tiptap-editor h1,
        .tiptap-editor h2,
        .tiptap-editor h3,
        .tiptap-editor h4,
        .tiptap-editor h5,
        .tiptap-editor h6 {
          margin: 1em 0 0.5em 0;
          line-height: 1.3;
        }

        .tiptap-editor blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 1em 0;
          color: #6b7280;
        }

        .dark .tiptap-editor blockquote {
          border-left-color: #4b5563;
          color: #9ca3af;
        }

        /* 長い単語・URLの強制改行 */
        .ProseMirror * {
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }

        /* コードブロックや特殊要素も改行 */
        .ProseMirror pre,
        .ProseMirror code {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          overflow-x: hidden !important;
        }

        /* リスト表示の修正 */
        .ProseMirror ul,
        .ProseMirror ol {
          margin: 1em 0;
          padding-left: 1.5rem;
        }

        .ProseMirror ul li {
          list-style-type: disc;
          margin: 0.25em 0;
        }

        .ProseMirror ol li {
          list-style-type: decimal;
          margin: 0.25em 0;
        }

        .ProseMirror li p {
          margin: 0;
        }

        .prose-list {
          margin: 1em 0 !important;
          padding-left: 1.5rem !important;
        }

        .prose-bullet-list li {
          list-style-type: disc !important;
        }

        .prose-ordered-list li {
          list-style-type: decimal !important;
        }

        /* 全角スペースの強調表示 */
        .full-width-space-highlight {
          background-color: #fbbf24 !important;
          color: #92400e !important;
          border-radius: 3px !important;
          padding: 0 2px !important;
          font-weight: bold !important;
          position: relative !important;
          display: inline-block !important;
          min-width: 1em !important;
          text-align: center !important;
        }

        .full-width-space-highlight::before {
          content: "　" !important;
          position: absolute !important;
          top: -2px !important;
          left: 0 !important;
          right: 0 !important;
          font-size: 0.7em !important;
          background-color: #f59e0b !important;
          color: white !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
          font-weight: bold !important;
          z-index: 10 !important;
        }

        /* 改行マーカー */
        .hard-break-marker {
          color: #6b7280 !important;
          font-size: 14px !important;
          font-weight: bold !important;
          margin-left: 2px !important;
          opacity: 0.8 !important;
          user-select: none !important;
          pointer-events: none !important;
          display: inline-block !important;
          background-color: rgba(107, 114, 128, 0.1) !important;
          border-radius: 2px !important;
          padding: 0 2px !important;
        }

        /* 段落終了マーカー */
        .paragraph-end-marker {
          color: #6b7280 !important;
          font-size: 12px !important;
          font-weight: bold !important;
          margin-left: 2px !important;
          opacity: 0.6 !important;
          user-select: none !important;
          pointer-events: none !important;
          display: inline-block !important;
          background-color: rgba(107, 114, 128, 0.1) !important;
          border-radius: 2px !important;
          padding: 0 2px !important;
        }

        /* 段落マーカー */
        .paragraph-marker {
          color: #9ca3af !important;
          font-size: 16px !important;
          opacity: 0.7 !important;
          user-select: none !important;
          pointer-events: none !important;
          display: inline-block !important;
          background-color: rgba(156, 163, 175, 0.1) !important;
          border-radius: 2px !important;
          padding: 0 2px !important;
        }

        /* ダークモード用の調整 */
        .dark .full-width-space-highlight {
          background-color: #d97706 !important;
          color: #fbbf24 !important;
        }

        .dark .full-width-space-highlight::before {
          background-color: #f59e0b !important;
          color: #1f2937 !important;
        }

        .dark .hard-break-marker {
          color: #9ca3af !important;
          background-color: rgba(156, 163, 175, 0.2) !important;
        }

        .dark .paragraph-end-marker {
          color: #9ca3af !important;
          background-color: rgba(156, 163, 175, 0.2) !important;
        }

        .dark .paragraph-marker {
          color: #6b7280 !important;
          background-color: rgba(107, 114, 128, 0.2) !important;
        }

        /* Tiptap widget の共通スタイル */
        .tiptap-icon-widget {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: baseline !important;
        }
      `}</style>
    </div>
  );
}
