"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { common, createLowlight } from "lowlight";

// Custom components and hooks
import { Sidebar } from "./sidebar/Sidebar";
import { FileTabBar } from "./layout/FileTabBar";
import { Toolbar } from "./toolbar/Toolbar";
import LinkModal from "./LinkModal";
import LaTeXExportModal from "./LaTeXExportModal";
import { FontSizeExtension, VisibilityExtension } from "./extensions";
import { useFileManager } from "@/hooks/useFileManager";
import { useEditorOperations } from "@/hooks/useEditorOperations";
import { useEditorLayout } from "@/hooks/useEditorLayout";
import { useLinkModal } from "@/hooks/useLinkModal";
import { useEditorSync } from "@/hooks/useEditorSync";
import { useAutoSave } from "@/hooks/useAutoSave";
import { calculateTextStats } from "@/utils/statsUtils";
import {
  generateLaTeXDocument,
  downloadLaTeXFile,
  type LaTeXExportOptions,
} from "@/utils/latexExport";
import { marked } from "marked";

// コードブロック用のlowlightインスタンスを作成
const lowlight = createLowlight(common);

export default function CharCountProEditor() {
  const [mounted, setMounted] = useState(false);

  // Hydration対策：クライアントサイドでマウント完了を追跡
  useEffect(() => {
    setMounted(true);
  }, []);

  // UI状態管理
  const [showNewlineMarkers, setShowNewlineMarkers] = useState(false);
  const [showFullWidthSpaces, setShowFullWidthSpaces] = useState(false);
  const [targetLength, setTargetLength] = useState<number>(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isSearchVisible] = useState(false);
  const [isTextTransformVisible] = useState(false);
  const [isTableMenuVisible, setIsTableMenuVisible] = useState(false);
  const [isCodeBlockMenuVisible, setIsCodeBlockMenuVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isShortcutsVisible, setIsShortcutsVisible] = useState(false);
  const [isLatexExportModalVisible, setIsLatexExportModalVisible] =
    useState(false);
  const [isMathModalVisible, setIsMathModalVisible] = useState(false);

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

  const layout = useEditorLayout();
  const {
    sidebarWidth,
    isResizing,
    sidebarCollapsed,
    setSidebarCollapsed,
    statisticsHeight,
    isStatisticsResizing,
    handleResizeStart,
    handleStatisticsResizeStart,
  } = layout;

  // エディター設定
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
        showParagraphMarkers: false,
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

  // カスタムフックの使用
  const editorOperations = useEditorOperations(editor);
  const linkModal = useLinkModal(editor);
  const {
    isLinkModalVisible,
    linkModalData,
    openLinkModal,
    handleLinkSave,
    handleLinkRemove,
    handleLinkCancel,
  } = linkModal;

  // エディター同期とオートセーブ
  useEditorSync(
    editor,
    activeFile,
    activeFileId,
    updateFileContent,
    isRestoredFromStorage,
    resetRestoredFlag
  );
  useAutoSave(fileTabs, activeFileId);

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
          visibilityExtension.options.showParagraphMarkers = false;
          visibilityExtension.options.showNewlineMarkers = showNewlineMarkers;
          visibilityExtension.options.showFullWidthSpaces = showFullWidthSpaces;
        }
      });
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, showNewlineMarkers, showFullWidthSpaces]);

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

  // LaTeXエクスポート処理
  const handleLatexExport = () => {
    setIsLatexExportModalVisible(true);
  };

  const handleLatexExportConfirm = (
    options: LaTeXExportOptions,
    content: string
  ) => {
    if (activeFile) {
      try {
        const latexContent = generateLaTeXDocument(content, options);
        downloadLaTeXFile(latexContent, activeFile.name || "document");
      } catch (error) {
        console.error("LaTeX export failed:", error);
        alert("LaTeXエクスポートに失敗しました。");
      }
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

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-900">
      {/* VS Code風サイドバー */}
      <Sidebar
        sidebarWidth={sidebarWidth}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isResizing={isResizing}
        handleResizeStart={handleResizeStart}
        statisticsHeight={statisticsHeight}
        isStatisticsResizing={isStatisticsResizing}
        handleStatisticsResizeStart={handleStatisticsResizeStart}
        fileTabs={fileTabs}
        activeFileId={activeFileId}
        activeFile={activeFile}
        setActiveFileId={setActiveFileId}
        addNewFile={addNewFile}
        closeFile={closeFile}
        renameFile={renameFile}
        exportFile={exportFile}
        instantSave={instantSave}
        handleFileImport={handleFileImport}
        editor={editor}
        targetLength={targetLength}
        showAdvancedStats={showAdvancedStats}
        setShowAdvancedStats={setShowAdvancedStats}
        isSaving={isSaving}
        mounted={mounted}
      />

      {/* メインエディター領域 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {/* VS Code風ファイルタブバー */}
        <FileTabBar
          fileTabs={fileTabs}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          closeFile={closeFile}
          addNewFile={addNewFile}
        />

        {/* VS Code風ツールバー */}
        <Toolbar
          editor={editor}
          isCodeBlockMenuVisible={isCodeBlockMenuVisible}
          setIsCodeBlockMenuVisible={setIsCodeBlockMenuVisible}
          isTableMenuVisible={isTableMenuVisible}
          setIsTableMenuVisible={setIsTableMenuVisible}
          isPreviewVisible={isPreviewVisible}
          setIsPreviewVisible={setIsPreviewVisible}
          isShortcutsVisible={isShortcutsVisible}
          setIsShortcutsVisible={setIsShortcutsVisible}
          isMathModalVisible={isMathModalVisible}
          setIsMathModalVisible={setIsMathModalVisible}
          showFullWidthSpaces={showFullWidthSpaces}
          setShowFullWidthSpaces={setShowFullWidthSpaces}
          showNewlineMarkers={showNewlineMarkers}
          setShowNewlineMarkers={setShowNewlineMarkers}
          onLinkClick={openLinkModal}
          onLatexExport={handleLatexExport}
          stats={stats}
          targetLength={targetLength}
          setTargetLength={setTargetLength}
          targetProgress={targetProgress}
        />

        {/* 検索・置換パネル */}
        {/* TODO: Search and replace functionality will be restored later */}
        {false && isSearchVisible && (
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
            </div>
          </div>
        )}

        {/* テキスト変換パネル */}
        {/* TODO: Text transformation functionality will be restored later */}
        {false && isTextTransformVisible && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 max-w-4xl">
              {/* テキスト変換ボタンがここに入る */}
            </div>
          </div>
        )}

        {/* テーブル操作パネル */}
        {isTableMenuVisible && editor?.isActive("table") && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {/* テーブル操作ボタンがここに入る */}
          </div>
        )}

        {/* コードブロック設定パネル */}
        {isCodeBlockMenuVisible && editor?.isActive("codeBlock") && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {/* コードブロック設定がここに入る */}
          </div>
        )}

        {/* エディター本体 */}
        <div className="flex-1 relative bg-white dark:bg-slate-900">
          {/* プレビューと分割表示 */}
          <div
            className={`flex h-full ${
              isPreviewVisible
                ? "divide-x divide-slate-200 dark:divide-slate-700"
                : ""
            }`}
          >
            {/* エディター */}
            <div
              className={`${isPreviewVisible ? "w-1/2" : "w-full"} relative`}
            >
              <EditorContent
                editor={editor}
                className="h-full overflow-y-auto prose prose-slate dark:prose-invert max-w-none"
              />
            </div>

            {/* プレビュー */}
            {isPreviewVisible && (
              <div className="w-1/2 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4">
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: marked(
                      getPlainTextFromHtml(activeFile?.content || "")
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* キーボードショートカットパネル */}
      {isShortcutsVisible && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsShortcutsVisible(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            {/* ショートカット一覧がここに入る */}
          </div>
        </div>
      )}

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

      {/* LaTeXエクスポートモーダル */}
      <LaTeXExportModal
        isOpen={isLatexExportModalVisible}
        onClose={() => setIsLatexExportModalVisible(false)}
        onExport={handleLatexExportConfirm}
        content={activeFile?.content || ""}
        filename={activeFile?.name || "document"}
      />

      {/* カスタムスタイル */}
      <style jsx global>{`
        /* 全角スペースの強調表示 */
        .full-width-space-highlight {
          background: rgba(255, 0, 0, 0.3) !important;
          border-radius: 2px !important;
        }

        /* 改行マーカー */
        .hard-break-marker,
        .paragraph-end-marker {
          color: rgba(148, 163, 184, 0.6) !important;
          font-size: 10px !important;
          font-weight: bold !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        .dark .hard-break-marker,
        .dark .paragraph-end-marker {
          color: rgba(148, 163, 184, 0.4) !important;
        }

        /* 段落マーカー */
        .paragraph-marker {
          color: rgba(148, 163, 184, 0.6) !important;
          font-size: 12px !important;
          font-weight: bold !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        .dark .paragraph-marker {
          color: rgba(148, 163, 184, 0.4) !important;
        }

        /* Tiptapエディターのスタイリング */
        .tiptap-editor {
          outline: none !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
        }

        .tiptap-editor p {
          margin: 0.5em 0 !important;
        }

        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }

        .tiptap-editor li {
          margin: 0.25em 0 !important;
        }

        .tiptap-editor pre {
          background: rgba(148, 163, 184, 0.1) !important;
          border-radius: 6px !important;
          padding: 1em !important;
          margin: 1em 0 !important;
          overflow-x: auto !important;
        }

        .tiptap-editor code {
          background: rgba(148, 163, 184, 0.1) !important;
          border-radius: 3px !important;
          padding: 0.2em 0.4em !important;
          font-size: 0.9em !important;
        }

        .tiptap-editor blockquote {
          border-left: 4px solid rgba(148, 163, 184, 0.3) !important;
          padding-left: 1em !important;
          margin: 1em 0 !important;
          font-style: italic !important;
        }

        .tiptap-editor hr {
          border: none !important;
          border-top: 2px solid rgba(148, 163, 184, 0.3) !important;
          margin: 2em 0 !important;
        }

        .tiptap-editor table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 1em 0 !important;
        }

        .tiptap-editor th,
        .tiptap-editor td {
          border: 1px solid rgba(148, 163, 184, 0.3) !important;
          padding: 0.5em !important;
          text-align: left !important;
        }

        .tiptap-editor th {
          background: rgba(148, 163, 184, 0.1) !important;
          font-weight: bold !important;
        }

        .tiptap-editor .task-list {
          list-style: none !important;
          padding-left: 0 !important;
        }

        .tiptap-editor .task-item {
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.5em !important;
        }

        .tiptap-editor .task-item input[type="checkbox"] {
          margin: 0 !important;
          margin-top: 0.2em !important;
        }

        /* Math expressions */
        .tiptap-editor .katex {
          font-size: 1em !important;
        }

        /* 数式のインライン表示 */
        .tiptap-editor .math-inline {
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
    </div>
  );
}
