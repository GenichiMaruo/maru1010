"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Mathematics from "@tiptap/extension-mathematics";
import { Extension } from "@tiptap/core";
import { common, createLowlight } from "lowlight";
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
  FaCode,
  FaQuoteRight,
  FaHeading,
  FaMinus,
  FaTable,
  FaImage,
  FaLink,
  FaUnlink,
  FaCheckSquare,
  FaCalculator,
  FaEye,
  FaKeyboard,
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
import LinkModal from "./LinkModal";

// Custom hooks and utilities
import { useFileManager } from "@/hooks/useFileManager";
import { useEditorOperations } from "@/hooks/useEditorOperations";
import { calculateTextStats } from "@/utils/statsUtils";
import { StatisticsPanel } from "./StatisticsPanel";
import { marked } from "marked";

// コードブロック用のlowlightインスタンスを作成
const lowlight = createLowlight(common);

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Hydration対策：クライアントサイドでマウント完了を追跡
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [statisticsHeight, setStatisticsHeight] = useState(300);
  const [isStatisticsResizing, setIsStatisticsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const statisticsResizeRef = useRef<HTMLDivElement>(null);

  // UI状態管理
  const [selectedLanguage, setSelectedLanguage] =
    useState("generic_block_line");
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isTextTransformVisible, setIsTextTransformVisible] = useState(false);
  const [isTableMenuVisible, setIsTableMenuVisible] = useState(false);
  const [isCodeBlockMenuVisible, setIsCodeBlockMenuVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isShortcutsVisible, setIsShortcutsVisible] = useState(false);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [linkModalData, setLinkModalData] = useState({
    url: "",
    text: "",
    isEditing: false,
  });

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
    isSaving,
    isRestoredFromStorage,
    resetRestoredFlag,
  } = fileManager;

  // エディター設定（可視化機能を追加）
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // デフォルトのcodeBlockを無効化してCodeBlockLowlightを使用
      }),
      TextStyle,
      Underline,
      Strike,
      FontSizeExtension,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      // テーブル関連の拡張機能
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      // タスクリスト関連の拡張機能
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      // 画像とリンクの拡張機能
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class:
            "text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
        },
      }),
      // 数式サポート
      Mathematics,
      VisibilityExtension.configure({
        showParagraphMarkers: showParagraphMarkers,
        showNewlineMarkers: showNewlineMarkers,
        showFullWidthSpaces: showFullWidthSpaces,
      }),
    ],
    content: "<p></p>", // 初期値はシンプルに
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

  // Hydration対策：クライアントサイドでマウント完了を追跡
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // VS Code風統計パネルリサイザー
  const handleStatisticsResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsStatisticsResizing(true);

      // 初期マウス位置を記録
      const startY = e.clientY;
      const startHeight = statisticsHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // マウスの移動距離を計算
        const deltaY = startY - moveEvent.clientY;
        const newHeight = Math.max(180, Math.min(800, startHeight + deltaY));
        setStatisticsHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsStatisticsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [statisticsHeight]
  );

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

  // アクティブファイルの内容から統計を計算（プレーンテキストに変換）
  const getPlainTextFromHtml = useCallback((html: string): string => {
    if (!html) return "";

    // 簡単なHTMLタグ除去（より正確にテキストを抽出）
    return html
      .replace(/<\/p>/g, "\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<\/div>/g, "\n")
      .replace(/<\/li>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();
  }, []);

  // 基本統計計算（アクティブファイルの内容から直接計算）
  const stats = activeFile
    ? calculateTextStats(getPlainTextFromHtml(activeFile.content))
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

  // リンクモーダルのハンドラー関数
  const handleLinkSave = useCallback(
    (url: string, text: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;

      if (linkModalData.isEditing) {
        // 既存リンクの編集
        if (text && from !== to) {
          // テキストも変更する場合
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(text)
            .setTextSelection({ from, to: from + text.length })
            .setLink({ href: url })
            .run();
        } else {
          // URLのみ変更
          editor.chain().focus().setLink({ href: url }).run();
        }
      } else {
        // 新しいリンクの挿入
        if (from === to) {
          // 選択範囲がない場合
          const linkText =
            text || url.replace(/^https?:\/\//, "").replace(/\/$/, "") || url;
          const position = editor.state.selection.from;
          editor
            .chain()
            .focus()
            .insertContent(linkText)
            .setTextSelection({
              from: position,
              to: position + linkText.length,
            })
            .setLink({ href: url })
            .run();
        } else {
          // 選択範囲がある場合
          if (text && text !== editor.state.doc.textBetween(from, to)) {
            // テキストを変更する場合
            editor
              .chain()
              .focus()
              .deleteSelection()
              .insertContent(text)
              .setTextSelection({ from, to: from + text.length })
              .setLink({ href: url })
              .run();
          } else {
            // 選択されたテキストをそのまま使用
            editor.chain().focus().setLink({ href: url }).run();
          }
        }
      }

      setIsLinkModalVisible(false);
    },
    [editor, linkModalData.isEditing]
  );

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().unsetLink().run();

    setIsLinkModalVisible(false);
  }, [editor]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkModalVisible(false);
  }, []);

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
              <div
                ref={statisticsResizeRef}
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

              {/* 統計パネルコンテンツ */}
              <div
                className="flex flex-col"
                style={{ height: `${statisticsHeight}px` }}
              >
                <div className="flex-shrink-0 p-2 pt-4">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    STATISTICS
                  </div>
                </div>

                {/* スクロール可能な統計エリア */}
                <div className="statistics-scrollbar flex-1 overflow-y-auto px-2 pb-2 min-h-0">
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

            {/* マークダウン機能 */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 1 })
                          .run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("heading", { level: 1 })
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaHeading className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Heading 1 (Ctrl+Alt+1)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editor?.isActive("codeBlock")) {
                          setIsCodeBlockMenuVisible(!isCodeBlockMenuVisible);
                        } else {
                          editor?.chain().focus().toggleCodeBlock().run();
                        }
                      }}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("codeBlock") || isCodeBlockMenuVisible
                          ? "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaCode className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {editor?.isActive("codeBlock")
                      ? "Code Block Settings"
                      : "Code Block (Ctrl+Alt+C)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleBlockquote().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("blockquote")
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaQuoteRight className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Blockquote (Ctrl+Shift+B)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().setHorizontalRule().run()
                      }
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FaMinus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Horizontal Rule</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleCode().run()}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("code")
                          ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-xs font-mono">{"`"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Inline Code (Ctrl+E)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* 高度なマークダウン機能 */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editor?.isActive("table")) {
                          setIsTableMenuVisible(!isTableMenuVisible);
                        } else {
                          editor
                            ?.chain()
                            .focus()
                            .insertTable({
                              rows: 3,
                              cols: 3,
                              withHeaderRow: true,
                            })
                            .run();
                        }
                      }}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("table") || isTableMenuVisible
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaTable className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {editor?.isActive("table")
                      ? "Table Operations"
                      : "Insert Table"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editor?.chain().focus().toggleTaskList().run()
                      }
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("taskList")
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaCheckSquare className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Task List</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.accept = "image/*";
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const url = event.target?.result as string;
                              editor
                                ?.chain()
                                .focus()
                                .setImage({ src: url, alt: file.name })
                                .run();
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        fileInput.click();
                      }}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FaImage className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insert Image (Upload or URL)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!editor) return;

                        const { from, to } = editor.state.selection;
                        const selectedText = editor.state.doc.textBetween(
                          from,
                          to
                        );

                        // 既存のリンクがある場合は編集
                        const currentLink = editor.getAttributes("link").href;

                        if (currentLink) {
                          // 既存リンクを編集
                          setLinkModalData({
                            url: currentLink,
                            text: selectedText || "",
                            isEditing: true,
                          });
                        } else if (
                          selectedText &&
                          selectedText.startsWith("http")
                        ) {
                          // 選択されたテキストがURLの場合
                          setLinkModalData({
                            url: selectedText,
                            text: "",
                            isEditing: false,
                          });
                        } else {
                          // 新しいリンク作成
                          setLinkModalData({
                            url: "",
                            text: selectedText || "",
                            isEditing: false,
                          });
                        }

                        setIsLinkModalVisible(true);
                      }}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        editor?.isActive("link")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaLink className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insert/Edit Link</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editor) {
                          editor
                            .chain()
                            .focus()
                            .extendMarkRange("link")
                            .unsetLink()
                            .run();
                        }
                      }}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      disabled={!editor?.isActive("link")}
                    >
                      <FaUnlink className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Link</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const equation = prompt(
                          "Enter LaTeX equation (e.g., E = mc^2):"
                        );
                        if (equation) {
                          editor
                            ?.chain()
                            .focus()
                            .insertContent(`$$${equation}$$`)
                            .run();
                        }
                      }}
                      className="h-6 w-6 p-0 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FaCalculator className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insert Math Equation</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        isPreviewVisible
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaEye className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsShortcutsVisible(!isShortcutsVisible)}
                      className={`h-6 w-6 p-0 rounded-sm ${
                        isShortcutsVisible
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <FaKeyboard className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Keyboard Shortcuts</TooltipContent>
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

          {/* 中央: フォントサイズと見出しレベル */}
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={
                        editor?.isActive("heading", { level: 1 })
                          ? "h1"
                          : editor?.isActive("heading", { level: 2 })
                          ? "h2"
                          : editor?.isActive("heading", { level: 3 })
                          ? "h3"
                          : editor?.isActive("heading", { level: 4 })
                          ? "h4"
                          : editor?.isActive("heading", { level: 5 })
                          ? "h5"
                          : editor?.isActive("heading", { level: 6 })
                          ? "h6"
                          : "p"
                      }
                      onValueChange={(value) => {
                        if (value === "p") {
                          editor?.chain().focus().setParagraph().run();
                        } else {
                          const level = parseInt(value.replace("h", "")) as
                            | 1
                            | 2
                            | 3
                            | 4
                            | 5
                            | 6;
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level })
                            .run();
                        }
                      }}
                    >
                      <SelectTrigger className="w-16 h-6 text-xs bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">P</SelectItem>
                        <SelectItem value="h1">H1</SelectItem>
                        <SelectItem value="h2">H2</SelectItem>
                        <SelectItem value="h3">H3</SelectItem>
                        <SelectItem value="h4">H4</SelectItem>
                        <SelectItem value="h5">H5</SelectItem>
                        <SelectItem value="h6">H6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Heading Level</TooltipContent>
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

        {/* テーブル操作パネル */}
        {isTableMenuVisible && editor?.isActive("table") && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 max-w-4xl">
              {/* 行操作 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Rows:
                </span>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().addRowBefore().run()}
                  className="h-6 px-2 text-xs"
                >
                  Add Above
                </Button>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().addRowAfter().run()}
                  className="h-6 px-2 text-xs"
                >
                  Add Below
                </Button>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().deleteRow().run()}
                  className="h-6 px-2 text-xs"
                >
                  Delete Row
                </Button>
              </div>

              {/* 列操作 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Columns:
                </span>
                <Button
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().addColumnBefore().run()
                  }
                  className="h-6 px-2 text-xs"
                >
                  Add Left
                </Button>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().addColumnAfter().run()}
                  className="h-6 px-2 text-xs"
                >
                  Add Right
                </Button>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().deleteColumn().run()}
                  className="h-6 px-2 text-xs"
                >
                  Delete Column
                </Button>
              </div>

              {/* テーブル操作 */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Table:
                </span>
                <Button
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleHeaderRow().run()
                  }
                  className="h-6 px-2 text-xs"
                >
                  Toggle Header
                </Button>
                <Button
                  size="sm"
                  onClick={() => editor?.chain().focus().deleteTable().run()}
                  className="h-6 px-2 text-xs"
                >
                  Delete Table
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTableMenuVisible(false)}
                className="h-6 w-6 p-0 ml-auto"
              >
                <FaTimes className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* コードブロック言語選択パネル */}
        {isCodeBlockMenuVisible && editor?.isActive("codeBlock") && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 max-w-4xl">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Language:
                </span>
                <Select
                  value={
                    editor?.getAttributes("codeBlock")?.language || "plaintext"
                  }
                  onValueChange={(language) => {
                    editor
                      ?.chain()
                      .focus()
                      .updateAttributes("codeBlock", { language })
                      .run();
                  }}
                >
                  <SelectTrigger className="w-32 h-6 text-xs bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintext">Plain Text</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="swift">Swift</SelectItem>
                    <SelectItem value="kotlin">Kotlin</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="scss">SCSS</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCodeBlockMenuVisible(false)}
                className="h-6 w-6 p-0 ml-auto"
              >
                <FaTimes className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* エディター・プレビュー領域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* エディター */}
          <div
            className={`${
              isPreviewVisible ? "w-1/2" : "w-full"
            } overflow-hidden border-r border-slate-200 dark:border-slate-700`}
          >
            <EditorContent
              editor={editor}
              className="h-full overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900"
            />
          </div>

          {/* プレビューパネル */}
          {isPreviewVisible && (
            <div className="w-1/2 overflow-hidden bg-white dark:bg-slate-900">
              <div className="h-full overflow-y-auto p-4">
                <div className="markdown-preview">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: activeFile
                        ? marked(activeFile.content.replace(/<[^>]*>/g, ""))
                        : "",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* キーボードショートカットパネル */}
      {isShortcutsVisible && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Keyboard Shortcuts
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShortcutsVisible(false)}
                  className="h-8 w-8 p-0"
                >
                  <FaTimes className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* テキスト装飾 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Text Formatting
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Bold</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+B
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Italic</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+I
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Underline</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+U
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Inline Code</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+E
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* マークダウン */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Markdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Heading 1</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Alt+1
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Heading 2</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Alt+2
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Code Block</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Alt+C
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Blockquote</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Shift+B
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* ナビゲーション */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Navigation & Actions
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Select All</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+A
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Undo</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Z
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Redo</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+Y
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Find & Replace</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
                        Ctrl+F
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        /* マークダウン要素のスタイル */

        /* 見出し */
        .tiptap-editor h1 {
          font-size: 2em !important;
          font-weight: bold !important;
          margin: 1em 0 0.5em 0 !important;
          line-height: 1.2 !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding-bottom: 0.3em !important;
        }

        .tiptap-editor h2 {
          font-size: 1.5em !important;
          font-weight: bold !important;
          margin: 0.83em 0 0.5em 0 !important;
          line-height: 1.3 !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding-bottom: 0.3em !important;
        }

        .tiptap-editor h3 {
          font-size: 1.17em !important;
          font-weight: bold !important;
          margin: 1em 0 0.5em 0 !important;
          line-height: 1.3 !important;
        }

        .tiptap-editor h4 {
          font-size: 1em !important;
          font-weight: bold !important;
          margin: 1.33em 0 0.5em 0 !important;
          line-height: 1.3 !important;
        }

        .tiptap-editor h5 {
          font-size: 0.83em !important;
          font-weight: bold !important;
          margin: 1.67em 0 0.5em 0 !important;
          line-height: 1.3 !important;
        }

        .tiptap-editor h6 {
          font-size: 0.67em !important;
          font-weight: bold !important;
          margin: 2.33em 0 0.5em 0 !important;
          line-height: 1.3 !important;
        }

        /* コードブロック */
        .tiptap-editor pre {
          background-color: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 6px !important;
          padding: 1rem !important;
          margin: 1em 0 !important;
          overflow-x: auto !important;
          font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
            Consolas, "Courier New", monospace !important;
          font-size: 0.875em !important;
          line-height: 1.4 !important;
        }

        .tiptap-editor pre code {
          background: none !important;
          padding: 0 !important;
          border: none !important;
          font-size: inherit !important;
        }

        /* インラインコード */
        .tiptap-editor code {
          background-color: #f1f3f4 !important;
          padding: 0.2em 0.4em !important;
          border-radius: 3px !important;
          font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
            Consolas, "Courier New", monospace !important;
          font-size: 0.875em !important;
          color: #e91e63 !important;
        }

        /* 引用 */
        .tiptap-editor blockquote {
          border-left: 4px solid #ddd !important;
          padding-left: 1rem !important;
          margin: 1em 0 !important;
          color: #6b7280 !important;
          font-style: italic !important;
          background-color: #f9fafb !important;
          padding: 1rem !important;
          border-radius: 0 4px 4px 0 !important;
        }

        /* 水平線 */
        .tiptap-editor hr {
          border: none !important;
          border-top: 3px solid #e5e7eb !important;
          margin: 2em 0 !important;
          text-align: center !important;
        }

        .tiptap-editor hr::before {
          content: "§" !important;
          display: inline-block !important;
          position: relative !important;
          top: -0.7em !important;
          font-size: 1.5em !important;
          padding: 0 0.25em !important;
          background: white !important;
          color: #9ca3af !important;
        }

        /* テーブル */
        .tiptap-editor table {
          border-collapse: collapse !important;
          table-layout: fixed !important;
          width: 100% !important;
          margin: 1em 0 !important;
          overflow: hidden !important;
          border: 1px solid #d1d5db !important;
        }

        .tiptap-editor td,
        .tiptap-editor th {
          min-width: 1em !important;
          border: 1px solid #d1d5db !important;
          padding: 8px 12px !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
        }

        .tiptap-editor th {
          font-weight: bold !important;
          text-align: left !important;
          background-color: #f9fafb !important;
        }

        .tiptap-editor .selectedCell:after {
          z-index: 2 !important;
          position: absolute !important;
          content: "" !important;
          left: 0 !important;
          right: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          background: rgba(59, 130, 246, 0.1) !important;
          pointer-events: none !important;
        }

        .tiptap-editor .column-resize-handle {
          position: absolute !important;
          right: -2px !important;
          top: 0 !important;
          bottom: -2px !important;
          width: 4px !important;
          background-color: #3b82f6 !important;
          pointer-events: none !important;
        }

        .tiptap-editor .tableWrapper {
          padding: 1rem 0 !important;
          overflow-x: auto !important;
        }

        .tiptap-editor .resize-cursor {
          cursor: ew-resize !important;
          cursor: col-resize !important;
        }

        /* タスクリスト */
        .tiptap-editor ul[data-type="taskList"] {
          list-style: none !important;
          padding: 0 !important;
          margin: 1em 0 !important;
        }

        .tiptap-editor ul[data-type="taskList"] li {
          display: flex !important;
          align-items: center !important;
          margin: 0.25em 0 !important;
        }

        .tiptap-editor ul[data-type="taskList"] li > label {
          flex: 0 0 auto !important;
          margin-right: 0.5rem !important;
          user-select: none !important;
        }

        .tiptap-editor ul[data-type="taskList"] li > div {
          flex: 1 1 auto !important;
        }

        .tiptap-editor ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer !important;
          width: 1em !important;
          height: 1em !important;
          accent-color: #3b82f6 !important;
        }

        /* 画像 */
        .tiptap-editor img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 1em 0 !important;
          display: block !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        .tiptap-editor img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }

        /* リンク */
        .tiptap-editor a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          transition: color 0.2s ease !important;
        }

        .tiptap-editor a:hover {
          color: #1d4ed8 !important;
          text-decoration: underline !important;
        }

        /* ダークモード用のテーブル調整 */
        .dark .tiptap-editor table {
          border-color: #4b5563 !important;
        }

        .dark .tiptap-editor td,
        .dark .tiptap-editor th {
          border-color: #4b5563 !important;
        }

        .dark .tiptap-editor th {
          background-color: #374151 !important;
          color: #f9fafb !important;
        }

        .dark .tiptap-editor .selectedCell:after {
          background: rgba(59, 130, 246, 0.2) !important;
        }

        /* ダークモード用のマークダウン要素調整 */
        .dark .tiptap-editor h1,
        .dark .tiptap-editor h2 {
          border-bottom-color: #4b5563 !important;
        }

        .dark .tiptap-editor pre {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #f9fafb !important;
        }

        .dark .tiptap-editor code {
          background-color: #374151 !important;
          color: #f472b6 !important;
        }

        .dark .tiptap-editor blockquote {
          border-left-color: #4b5563 !important;
          background-color: #1f2937 !important;
          color: #9ca3af !important;
        }

        .dark .tiptap-editor hr {
          border-top-color: #4b5563 !important;
        }

        .dark .tiptap-editor hr::before {
          background: #0f172a !important;
          color: #6b7280 !important;
        }

        .dark .tiptap-editor a {
          color: #60a5fa !important;
        }

        .dark .tiptap-editor a:hover {
          color: #3b82f6 !important;
        }

        /* 数式スタイル */
        .math-equation {
          display: inline-block !important;
          margin: 0.5em 0 !important;
          padding: 0.5em !important;
          background-color: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 4px !important;
          font-family: "KaTeX_Main", "Times New Roman", serif !important;
        }

        .dark .math-equation {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #f9fafb !important;
        }

        /* プレビューエリアのスタイル */
        .markdown-preview {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
            "Helvetica Neue", Arial, sans-serif !important;
          line-height: 1.6 !important;
          color: #333 !important;
        }

        .dark .markdown-preview {
          color: #f8fafc !important;
        }

        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          margin-top: 24px !important;
          margin-bottom: 16px !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
        }

        .markdown-preview h1 {
          font-size: 2em !important;
          border-bottom: 1px solid #eaecef !important;
          padding-bottom: 0.3em !important;
        }

        .markdown-preview h2 {
          font-size: 1.5em !important;
          border-bottom: 1px solid #eaecef !important;
          padding-bottom: 0.3em !important;
        }

        .dark .markdown-preview h1,
        .dark .markdown-preview h2 {
          border-bottom-color: #4b5563 !important;
        }

        .markdown-preview pre {
          background-color: #f6f8fa !important;
          border-radius: 6px !important;
          padding: 16px !important;
          overflow: auto !important;
          font-size: 85% !important;
          line-height: 1.45 !important;
        }

        .dark .markdown-preview pre {
          background-color: #1f2937 !important;
        }

        .markdown-preview code {
          background-color: rgba(175, 184, 193, 0.2) !important;
          padding: 0.2em 0.4em !important;
          border-radius: 3px !important;
          font-size: 85% !important;
        }

        .dark .markdown-preview code {
          background-color: rgba(110, 118, 129, 0.4) !important;
        }

        .markdown-preview blockquote {
          padding: 0 1em !important;
          color: #6a737d !important;
          border-left: 0.25em solid #dfe2e5 !important;
          margin: 0 0 16px 0 !important;
        }

        .dark .markdown-preview blockquote {
          color: #8b949e !important;
          border-left-color: #4b5563 !important;
        }

        .markdown-preview table {
          border-spacing: 0 !important;
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 16px 0 !important;
        }

        .markdown-preview th,
        .markdown-preview td {
          padding: 6px 13px !important;
          border: 1px solid #dfe2e5 !important;
        }

        .markdown-preview th {
          font-weight: 600 !important;
          background-color: #f6f8fa !important;
        }

        .dark .markdown-preview th,
        .dark .markdown-preview td {
          border-color: #4b5563 !important;
        }

        .dark .markdown-preview th {
          background-color: #374151 !important;
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

        /* カスタムスクロールバー */
        .statistics-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .statistics-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 3px;
        }

        .statistics-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .statistics-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        .dark .statistics-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
        }

        .dark .statistics-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4);
        }

        .dark .statistics-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.6);
        }

        /* リサイザーのホバー効果 */
        .statistics-resizer {
          position: relative;
        }

        .statistics-resizer::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 2px;
          background: rgba(148, 163, 184, 0.4);
          border-radius: 1px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .statistics-resizer:hover::before,
        .statistics-resizer.resizing::before {
          opacity: 1;
        }

        .dark .statistics-resizer::before {
          background: rgba(203, 213, 225, 0.4);
        }
      `}</style>

      {/* リンクモーダル */}
      <LinkModal
        isOpen={isLinkModalVisible}
        onClose={handleLinkCancel}
        initialUrl={linkModalData.url}
        initialText={linkModalData.text}
        hasSelection={linkModalData.text !== ""}
        isEditMode={linkModalData.isEditing}
        onSave={handleLinkSave}
        onRemove={handleLinkRemove}
      />
    </div>
  );
}
