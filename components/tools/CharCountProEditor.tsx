"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEditor, Editor } from "@tiptap/react";
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
import { Toolbar } from "./toolbar/Toolbar";
import { SplitLayoutRenderer } from "./SplitLayoutRenderer";
import LinkModal from "./LinkModal";
import LaTeXExportModal from "./LaTeXExportModal";
import { CodeLanguageSelectModal } from "./CodeLanguageSelectModal";
import { CodeBlockSettingsPanel } from "./CodeBlockSettingsPanel";
import { TableOperationsPanel } from "./TableOperationsPanel";
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
import { saveAppState, loadAppState, clearAppState, debounce } from "@/utils/appStateManager";
import type { AppState, SavedFileTab, SavedSplitLayout } from "@/utils/appStateManager";
import { marked } from "marked";

// デバッグ用：グローバルに状態クリア機能を追加
if (typeof window !== 'undefined') {
  (window as typeof window & { clearCharCountProState: () => void }).clearCharCountProState = () => {
    clearAppState();
    localStorage.removeItem('char-count-pro-files');
    localStorage.removeItem('char-count-pro-active-file');
    console.log('🗑️ CharCountPro state cleared. Please reload the page.');
    window.location.reload();
  };
  console.log('💡 Debug: Use window.clearCharCountProState() to clear all saved state');
}

export default function CharCountProEditor() {
  const [mounted, setMounted] = useState(false);

  // Hydration対策：クライアントサイドでマウント完了を追跡
  useEffect(() => {
    setMounted(true);

    // ページ全体のスクロールを無効化
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // クリーンアップ時にスクロールを復元
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // UI状態管理
  const [showNewlineMarkers, setShowNewlineMarkers] = useState(false);
  const [showFullWidthSpaces, setShowFullWidthSpaces] = useState(false);
  const [targetLength, setTargetLength] = useState<number>(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isSearchVisible] = useState(false);
  const [isTableMenuVisible, setIsTableMenuVisible] = useState(false);
  const [isCodeBlockMenuVisible, setIsCodeBlockMenuVisible] = useState(false);
  const [isCodeLanguageSelectVisible, setIsCodeLanguageSelectVisible] =
    useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isShortcutsVisible, setIsShortcutsVisible] = useState(false);
  const [isLatexExportModalVisible, setIsLatexExportModalVisible] =
    useState(false);
  const [isMathModalVisible, setIsMathModalVisible] = useState(false);
  // ドラッグ&ドロップ用のstate
  const [isDragOver, setIsDragOver] = useState(false);
  // 現在編集中のファイルを追跡
  const [currentEditingFileId, setCurrentEditingFileId] = useState<
    string | null
  >(null);
  // アクティブなエディターインスタンスを管理
  const [activeEditorInstance, setActiveEditorInstance] =
    useState<Editor | null>(null);
  const [paneEditors, setPaneEditors] = useState<Map<string, Editor | null>>(
    new Map()
  );

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
    importFile,
    reorderFiles,
    instantSave,
    isSaving,
    isRestoredFromStorage,
    resetRestoredFlag,
    restoreFilesFromState,
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
    splitLayout,
    activePaneId,
    setActivePaneId,
    splitPane,
    closePane,
    assignFileToPane,
    removeFileFromPane,
    setActiveFileInPane,
    reorderTabsInPane,
    moveTabBetweenPanes,
    getAllPanes,
    updateSplitSizes,
    cleanupInvalidFileIds,
    restoreLayoutState,
    serializeSplitLayout,
    deserializeSplitLayout,
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
        lowlight: createLowlight(common),
        defaultLanguage: "plaintext",
        HTMLAttributes: {
          class: "hljs",
        },
      }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const language = node.attrs.language || "text";

          return [
            "pre",
            {
              ...HTMLAttributes,
              "data-language": language,
              class: `hljs language-${language}`,
            },
            ["code", {}, 0],
          ];
        },
      }),
      // テーブル関連の拡張機能
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "table-wrapper",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "table-row",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "table-header",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "table-cell",
        },
      }),
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
        style: `line-height: 1.6; padding: 2rem; min-height: 100%;`,
        spellcheck: "false",
      },
      handleClick: () => {
        handleMainEditorClick();
      },
      handleDOMEvents: {
        // composition events（IME入力）を適切に処理
        compositionstart: () => false,
        compositionupdate: () => false,
        compositionend: () => false,
        // input events（絵文字を含む）を適切に処理
        input: () => false,
      },
      handleKeyDown: (view, event) => {
        // 絵文字を含むUnicode文字の入力をサポート
        // 特殊文字（絵文字、アクセント文字など）の入力を妨げないようにする

        // Tabキーの処理
        if (event.key === "Tab") {
          event.preventDefault();

          const { state } = view;
          const { selection } = state;

          // リストアイテム内での処理
          if (
            state.schema.nodes.listItem &&
            selection.$from.node(-2)?.type === state.schema.nodes.listItem
          ) {
            if (event.shiftKey) {
              // Shift+Tab: リストのインデント解除
              return false; // デフォルトの動作を許可
            } else {
              // Tab: リストのインデント
              return false; // デフォルトの動作を許可
            }
          }

          // タスクリスト内での処理
          if (
            state.schema.nodes.taskItem &&
            selection.$from.node(-2)?.type === state.schema.nodes.taskItem
          ) {
            if (event.shiftKey) {
              // Shift+Tab: タスクリストのインデント解除
              return false; // デフォルトの動作を許可
            } else {
              // Tab: タスクリストのインデント
              return false; // デフォルトの動作を許可
            }
          }

          if (event.shiftKey) {
            // Shift+Tab: 通常のインデント解除（他の要素で使用される場合）
            return false; // デフォルトの動作を許可
          } else {
            // Tab: タブ文字を挿入
            const { dispatch } = view;
            const tabText = "\t"; // タブ文字
            const tr = state.tr.insertText(tabText);
            dispatch(tr);
            return true; // イベントを処理済みとする
          }
        }

        return false; // その他のキーはデフォルトの動作
      },
    },
    onFocus: () => {
      handleMainEditorClick();
    },
    onCreate: () => {
      // エディター作成時にも現在編集中のファイルを設定
      if (activeFileId) {
        setCurrentEditingFileId(activeFileId);
      }
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateFileContent(activeFileId, content);
      // エディター更新時にも現在編集中のファイルを確認
      if (activeFileId) {
        setCurrentEditingFileId(activeFileId);
      }
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

  // エディターとファイル状態の監視
  useEffect(() => {
    console.log("🎯 Editor-File State Monitor:", {
      editorExists: !!editor,
      editorIsFocused: editor?.isFocused,
      editorContent: editor?.getHTML()?.substring(0, 50) + "...",
      activeEditorExists: !!activeEditorInstance,
      activeEditorIsFocused: activeEditorInstance?.isFocused,
      activeFileId,
      activeFileName: activeFile?.name,
      currentEditingFileId,
      activePaneId,
      paneEditorsCount: paneEditors.size,
      areFilesSynced: activeFileId === currentEditingFileId,
    });
  }, [
    editor,
    activeEditorInstance,
    activeFileId,
    activeFile,
    currentEditingFileId,
    activePaneId,
    paneEditors,
  ]);

  // エディターがクリックされた時の文字数カウント対象変更処理
  const handleEditorClick = useCallback((paneId: string, fileId: string) => {
    console.log("📊 Setting character count target:", { paneId, fileId });
    // 文字数カウントの対象ファイルを変更（分割エディタの表示は変更しない）
    setCurrentEditingFileId(fileId);
    
    // 注意：setActiveFileIdは呼ばない（分割エディタの表示ファイルが変わってしまうため）
    // activeFileIdは文字数カウントとサイドバー表示にのみ影響し、
    // 分割エディタの表示ファイルには影響しない
  }, []);

  // メインエディタがクリックされた時の処理
  const handleMainEditorClick = useCallback(() => {
    if (activeFileId) {
      console.log("📊 Main editor clicked, setting stats target to:", activeFileId);
      setCurrentEditingFileId(activeFileId);
    }
  }, [activeFileId]);

  // 現在編集中ファイルの変更をログ出力
  useEffect(() => {
    if (currentEditingFileId) {
      const editingFile = fileTabs.find(f => f.id === currentEditingFileId);
      console.log("📊 Character count target changed:", {
        fileId: currentEditingFileId,
        fileName: editingFile?.name,
        contentLength: editingFile?.content.length,
      });
    }
  }, [currentEditingFileId, fileTabs]);

  // エディターがマウントされた後の初期化
  useEffect(() => {
    if (mounted && editor && activeFileId) {
      setCurrentEditingFileId(activeFileId);
    }
  }, [mounted, editor, activeFileId]);

  // 初期化時に現在編集中のファイルを設定
  useEffect(() => {
    if (activeFileId) {
      setCurrentEditingFileId(activeFileId);
    }
  }, [activeFileId]);

  // アクティブファイルが変更された時にメインペインに割り当て
  useEffect(() => {
    if (activeFileId) {
      assignFileToPane("main", activeFileId);
      setCurrentEditingFileId(activeFileId);
    }
  }, [activeFileId, assignFileToPane]);

  // エディターインスタンス管理のコールバック
  const handleEditorReady = useCallback(
    (paneId: string, editor: Editor | null) => {
      console.log("📝 Editor Ready:", { paneId, editorExists: !!editor });

      setPaneEditors((prev) => {
        const newMap = new Map(prev);
        newMap.set(paneId, editor);
        return newMap;
      });

      // アクティブペインのエディターを更新
      if (paneId === activePaneId && editor) {
        console.log("🎯 Setting active editor instance for pane:", paneId);
        setActiveEditorInstance(editor);
      }
    },
    [activePaneId]
  );

  // アクティブペインが変更された時にアクティブエディターも更新
  useEffect(() => {
    if (activePaneId) {
      const activeEditor = paneEditors.get(activePaneId);
      if (activeEditor && activeEditor !== activeEditorInstance) {
        console.log(
          "🔄 Switching active editor instance to pane:",
          activePaneId
        );
        setActiveEditorInstance(activeEditor);
      }
    }
  }, [activePaneId, paneEditors, activeEditorInstance]);

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

  // ファイル状態のシリアライゼーション（早期定義）
  const serializeFileTabs = useCallback((tabs: typeof fileTabs) => {
    return tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      content: tab.content,
      isDirty: tab.isDirty,
      lastSaved: tab.lastSaved.toISOString(),
    }));
  }, []);

  const deserializeFileTabs = useCallback((savedTabs: SavedFileTab[]) => {
    return savedTabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      content: tab.content,
      isDirty: tab.isDirty,
      lastSaved: new Date(tab.lastSaved),
    }));
  }, []);

  // 無効なファイルIDのクリーンアップ
  useEffect(() => {
    const validFileIds = fileTabs.map((file) => file.id);
    cleanupInvalidFileIds(validFileIds);
  }, [fileTabs, cleanupInvalidFileIds]);

  // ファイルインポート処理
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFileContent(file);
    }
  };

  // ファイルコンテンツのインポート処理を共通化
  const importFileContent = useCallback(
    async (file: File) => {
      try {
        const content = await importFile(file, activeFileId);
        updateFileContent(activeFileId, content);
      } catch (error) {
        console.error("Failed to import file:", error);
        alert("ファイルの読み込みに失敗しました。");
      }
    },
    [importFile, activeFileId, updateFileContent]
  );

  // ドラッグ&ドロップイベントハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // タブのドラッグ&ドロップかどうかをデータ転送の種類でチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合は外部ファイルドロップのUIを表示しない
    if (hasTabData && !hasFiles) {
      return;
    }

    // 外部ファイルの場合のみドラッグオーバー状態を設定
    if (hasFiles) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // ドラッグがエディター領域から完全に出た時のみfalseにする
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // データ転送の種類をチェック
      const hasTabData = e.dataTransfer.types.includes("application/json");
      const hasFiles = e.dataTransfer.types.includes("Files");

      // タブのドラッグ&ドロップの場合は何もしない
      if (hasTabData && !hasFiles) {
        return;
      }

      // 外部ファイルのドロップ処理
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        // テキストファイルのみ許可
        if (
          file.type.startsWith("text/") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".json")
        ) {
          await importFileContent(file);
        } else {
          alert("テキストファイル（.txt、.md、.json）のみ対応しています。");
        }
      }
    },
    [importFileContent]
  );

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

  // エディターの現在のテキストから統計を計算（現在編集中のファイルから取得）
  const getCurrentEditorText = useCallback((): string => {
    if (!currentEditingFileId) return "";
    
    // 現在編集中のファイルの内容を取得
    const editingFile = fileTabs.find((f) => f.id === currentEditingFileId);
    if (!editingFile) return "";
    
    // そのファイルを表示しているエディターインスタンスを探す
    for (const [paneId, editorInstance] of paneEditors.entries()) {
      const pane = getAllPanes().find(p => p.id === paneId);
      if (pane && pane.activeFileId === currentEditingFileId && editorInstance) {
        console.log("📊 Getting text from pane editor:", paneId, "for file:", currentEditingFileId);
        return editorInstance.getText();
      }
    }
    
    // メインエディターを確認
    if (activeFileId === currentEditingFileId && editor) {
      console.log("📊 Getting text from main editor for file:", currentEditingFileId);
      return editor.getText();
    }
    
    // エディターが見つからない場合は、ファイルの保存済み内容から計算
    console.log("📊 Getting text from file content (no active editor) for file:", currentEditingFileId);
    // HTMLタグを除去してプレーンテキストを取得
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editingFile.content;
    return tempDiv.textContent || tempDiv.innerText || '';
  }, [currentEditingFileId, fileTabs, paneEditors, getAllPanes, activeFileId, editor]);

  // 基本統計計算（現在編集中のファイルから計算）
  const stats = currentEditingFileId && fileTabs.find(f => f.id === currentEditingFileId)
    ? calculateTextStats(getCurrentEditorText())
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

  // 現在編集中のファイルの内容を取得
  const getCurrentEditingFileContent = useCallback((): string => {
    if (!currentEditingFileId) return "";
    const editingFile = fileTabs.find((f) => f.id === currentEditingFileId);
    return editingFile?.content || "";
  }, [currentEditingFileId, fileTabs]);

  // 状態復元とデバウンス保存の設定
  const debouncedSaveState = useCallback((state: Partial<AppState>) => {
    const debouncedFn = debounce(() => {
      saveAppState(state);
    }, 1000);
    debouncedFn();
  }, []);

  // 初期化時に状態を復元
  useEffect(() => {
    if (!mounted) return;

    const savedState = loadAppState();
    if (savedState) {
      console.log('🔄 Loading saved app state:', {
        filesCount: savedState.fileTabs?.length || 0,
        activeFileId: savedState.activeFileId,
        activePaneId: savedState.activePaneId,
        splitLayoutType: savedState.splitLayout?.type,
        lastSaved: savedState.lastSaved ? new Date(savedState.lastSaved).toLocaleString() : 'unknown',
      });
      
      // UI状態の復元
      if (typeof savedState.showNewlineMarkers === 'boolean') {
        setShowNewlineMarkers(savedState.showNewlineMarkers);
      }
      if (typeof savedState.showFullWidthSpaces === 'boolean') {
        setShowFullWidthSpaces(savedState.showFullWidthSpaces);
      }
      if (typeof savedState.targetLength === 'number') {
        setTargetLength(savedState.targetLength);
      }
      if (typeof savedState.showAdvancedStats === 'boolean') {
        setShowAdvancedStats(savedState.showAdvancedStats);
      }
      if (typeof savedState.isPreviewVisible === 'boolean') {
        setIsPreviewVisible(savedState.isPreviewVisible);
      }

      // ファイル状態の復元
      if (savedState.fileTabs && Array.isArray(savedState.fileTabs) && savedState.fileTabs.length > 0) {
        const restoredFiles = deserializeFileTabs(savedState.fileTabs);
        restoreFilesFromState(restoredFiles, savedState.activeFileId || null);
        console.log('📂 Restored files:', restoredFiles.map(f => ({ id: f.id, name: f.name, contentLength: f.content.length })));
      }

      // レイアウト状態の復元
      if (savedState.splitLayout) {
        const restoredLayout = deserializeSplitLayout(savedState.splitLayout as unknown as Record<string, unknown>);
        console.log('🖼️ Restoring layout:', { type: restoredLayout.type, hasChildren: !!restoredLayout.children });
        
        restoreLayoutState({
          sidebarWidth: savedState.sidebarWidth,
          statisticsHeight: savedState.statisticsHeight,
          sidebarCollapsed: savedState.sidebarCollapsed,
          splitLayout: restoredLayout,
          activePaneId: savedState.activePaneId,
        });
      } else {
        // レイアウト情報がない場合は基本的な設定のみ復元
        restoreLayoutState({
          sidebarWidth: savedState.sidebarWidth,
          statisticsHeight: savedState.statisticsHeight,
          sidebarCollapsed: savedState.sidebarCollapsed,
          activePaneId: savedState.activePaneId,
        });
      }

      console.log('✅ App state restored successfully');
    } else {
      console.log('ℹ️ No saved state found, using defaults');
    }
  }, [mounted, setSidebarCollapsed, restoreLayoutState, deserializeFileTabs, restoreFilesFromState, deserializeSplitLayout]);

  // 状態変更時にデバウンス保存の設定
  useEffect(() => {
    if (!mounted) return;

    // ファイル状態の包括的な保存
    const serializedFileTabs = serializeFileTabs(fileTabs);
    const serializedSplitLayout = serializeSplitLayout(splitLayout);

    const currentState: Partial<AppState> = {
      showNewlineMarkers,
      showFullWidthSpaces,
      targetLength,
      showAdvancedStats,
      isPreviewVisible,
      sidebarWidth,
      statisticsHeight,
      sidebarCollapsed,
      activeFileId,
      activePaneId,
      fileTabs: serializedFileTabs,
      fileTabsOrder: fileTabs.map(f => f.id),
      splitLayout: serializedSplitLayout as unknown as SavedSplitLayout,
    };

    debouncedSaveState(currentState);
    console.log('💾 Saving comprehensive app state:', {
      filesCount: serializedFileTabs.length,
      activeFileId,
      activePaneId,
      splitLayoutType: splitLayout.type,
      hasChildren: splitLayout.children ? splitLayout.children.length : 0,
      fileNames: serializedFileTabs.map(f => f.name),
    });
    
    // デバッグ用：localStorage内容を表示
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('charCountPro_appState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('🗄️ Current localStorage state:', {
            filesCount: parsed.fileTabs?.length || 0,
            splitLayoutType: parsed.splitLayout?.type,
            lastSaved: new Date(parsed.lastSaved).toLocaleString(),
          });
        } catch (e) {
          console.warn('Failed to parse localStorage state:', e);
        }
      }
    }
  }, [
    mounted,
    showNewlineMarkers,
    showFullWidthSpaces,
    targetLength,
    showAdvancedStats,
    isPreviewVisible,
    sidebarWidth,
    statisticsHeight,
    sidebarCollapsed,
    activeFileId,
    activePaneId,
    fileTabs,
    splitLayout,
    serializeFileTabs,
    serializeSplitLayout,
    debouncedSaveState,
  ]);

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden fixed inset-0">
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
        currentEditingFileId={currentEditingFileId}
        currentEditingFileContent={getCurrentEditingFileContent()}
        activeFile={activeFile}
        setActiveFileId={setActiveFileId}
        addNewFile={addNewFile}
        closeFile={closeFile}
        renameFile={renameFile}
        exportFile={exportFile}
        instantSave={instantSave}
        handleFileImport={handleFileImport}
        onLatexExport={handleLatexExport}
        reorderFiles={reorderFiles}
        splitLayout={splitLayout}
        activePaneId={activePaneId}
        setActivePaneId={setActivePaneId}
        assignFileToPane={assignFileToPane}
        removeFileFromPane={removeFileFromPane}
        setActiveFileInPane={setActiveFileInPane}
        getAllPanes={getAllPanes}
        editor={editor}
        targetLength={targetLength}
        showAdvancedStats={showAdvancedStats}
        setShowAdvancedStats={setShowAdvancedStats}
        isSaving={isSaving}
        mounted={mounted}
      />

      {/* メインエディター領域 */}
      <div
        className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-h-0 min-w-0 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* VS Code風ツールバー */}
        <Toolbar
          editor={activeEditorInstance || editor}
          isCodeBlockMenuVisible={isCodeBlockMenuVisible}
          setIsCodeBlockMenuVisible={setIsCodeBlockMenuVisible}
          isCodeLanguageSelectVisible={isCodeLanguageSelectVisible}
          setIsCodeLanguageSelectVisible={setIsCodeLanguageSelectVisible}
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
        {false && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 max-w-4xl">
              {/* テキスト変換ボタンがここに入る */}
            </div>
          </div>
        )}

        {/* テーブル操作パネル */}
        <TableOperationsPanel
          editor={activeEditorInstance || editor}
          isVisible={isTableMenuVisible}
          onClose={() => setIsTableMenuVisible(false)}
        />

        {/* コードブロック設定パネル */}
        <CodeBlockSettingsPanel
          editor={activeEditorInstance || editor}
          isVisible={isCodeBlockMenuVisible}
          onClose={() => setIsCodeBlockMenuVisible(false)}
        />

        {/* エディター本体 */}
        <div className="flex-1 relative bg-white dark:bg-slate-900 min-h-0 min-w-0 overflow-hidden">
          {/* ドラッグオーバー時のオーバーレイ */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-500">
                <div className="text-center">
                  <div className="text-blue-500 text-4xl mb-2">📁</div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    ファイルをドロップしてください
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    対応形式: .txt, .md, .json
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* プレビューと分割表示 */}
          <div
            className={`flex h-full ${
              isPreviewVisible
                ? "divide-x divide-slate-200 dark:divide-slate-700"
                : ""
            }`}
          >
            {/* 分割エディターレイアウト */}
            <div
              className={`${
                isPreviewVisible ? "w-1/2" : "w-full"
              } relative h-full min-w-0 overflow-hidden`}
            >
              <SplitLayoutRenderer
                layout={splitLayout}
                files={fileTabs}
                activePaneId={activePaneId}
                onPaneActivate={setActivePaneId}
                onPaneClose={closePane}
                onPaneSplit={splitPane}
                onContentChange={(fileId, content) => {
                  updateFileContent(fileId, content);
                }}
                onFileTabClose={removeFileFromPane}
                onFileTabActivate={(paneId, fileId) => {
                  setActiveFileInPane(paneId, fileId);
                  // タブでファイルを選択した時も現在編集中ファイルを更新
                  setCurrentEditingFileId(fileId);
                  setActiveFileId(fileId);
                }}
                onTabReorder={reorderTabsInPane}
                onTabMove={moveTabBetweenPanes}
                onUpdateSplitSizes={updateSplitSizes}
                onEditorReady={handleEditorReady}
                onEditorClick={handleEditorClick}
                showNewlineMarkers={showNewlineMarkers}
                showFullWidthSpaces={showFullWidthSpaces}
              />
            </div>

            {/* プレビュー */}
            {isPreviewVisible && (
              <div className="w-1/2 h-full min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4">
                <div
                  className="prose prose-slate dark:prose-invert max-w-none min-w-0"
                  dangerouslySetInnerHTML={{
                    __html: marked(getCurrentEditorText()),
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
          overflow-wrap: break-word !important;
          tab-size: 4 !important; /* タブ文字のサイズを4スペース相当に設定 */
          -moz-tab-size: 4 !important;
          max-width: 100% !important;
          min-width: 0 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, "Noto Color Emoji", "Apple Color Emoji",
            "Segoe UI Emoji", "Segoe UI Symbol", sans-serif !important;
        }

        .tiptap-editor .ProseMirror {
          outline: none !important;
          padding: 1rem !important;
          min-height: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-wrap: break-word !important;
          font-family: inherit !important;
        }

        .tiptap-editor p {
          margin: 0.5em 0 !important;
        }

        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.25rem !important;
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
          max-width: 100% !important;
          white-space: pre !important;
          position: relative !important;
        }

        /* コードブロック内のProseMirror要素の位置調整 */
        .tiptap-editor pre .ProseMirror {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          font-family: "Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace !important;
          font-size: 0.9em !important;
          line-height: 1.5 !important;
          text-indent: 0 !important;
        }

        /* コードブロック内のProseMirrorの直接の子要素 */
        .tiptap-editor pre .ProseMirror > * {
          margin: 0 !important;
          text-indent: 0 !important;
          margin-left: 0 !important;
        }

        /* コードブロック内の行の統一された位置設定 */
        .tiptap-editor pre p {
          margin: 0 !important;
          line-height: 1.5 !important;
          text-indent: 0 !important;
        }

        /* コードブロック内のテキストノードの位置統一 */
        .tiptap-editor pre * {
          margin: 0 !important;
          text-indent: 0 !important;
        }

        /* コードブロック内の最初の行と他の行の位置を完全に統一 */
        .tiptap-editor pre p:first-child {
          margin: 0 !important;
          text-indent: 0 !important;
        }

        /* コードブロック内での全ての子要素の位置リセット */
        .tiptap-editor pre > * {
          margin: 0 !important;
          text-indent: 0 !important;
          display: block !important;
        }

        /* CodeBlockLowlight拡張機能用の追加スタイル */
        .tiptap-editor .hljs {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          display: block !important;
          overflow-x: visible !important;
          text-indent: 0 !important;
        }

        /* コードブロック内でのhljsクラス内の要素統一 */
        .tiptap-editor .hljs * {
          margin: 0 !important;
          text-indent: 0 !important;
        }

        /* ===== Syntax Highlighting Colors ===== */

        /* GitHub-like theme for light mode */
        .tiptap-editor .hljs-comment,
        .tiptap-editor .hljs-quote {
          color: #6a737d !important;
          font-style: italic !important;
        }

        .tiptap-editor .hljs-keyword,
        .tiptap-editor .hljs-selector-tag,
        .tiptap-editor .hljs-subst {
          color: #d73a49 !important;
          font-weight: bold !important;
        }

        .tiptap-editor .hljs-number,
        .tiptap-editor .hljs-literal,
        .tiptap-editor .hljs-variable,
        .tiptap-editor .hljs-template-variable,
        .tiptap-editor .hljs-tag .hljs-attr {
          color: #005cc5 !important;
        }

        .tiptap-editor .hljs-string,
        .tiptap-editor .hljs-doctag {
          color: #032f62 !important;
        }

        .tiptap-editor .hljs-title,
        .tiptap-editor .hljs-section,
        .tiptap-editor .hljs-selector-id {
          color: #6f42c1 !important;
          font-weight: bold !important;
        }

        .tiptap-editor .hljs-subst {
          font-weight: normal !important;
        }

        .tiptap-editor .hljs-type,
        .tiptap-editor .hljs-class .hljs-title {
          color: #d73a49 !important;
          font-weight: bold !important;
        }

        .tiptap-editor .hljs-tag,
        .tiptap-editor .hljs-name,
        .tiptap-editor .hljs-attribute {
          color: #22863a !important;
          font-weight: normal !important;
        }

        .tiptap-editor .hljs-regexp,
        .tiptap-editor .hljs-link {
          color: #e36209 !important;
        }

        .tiptap-editor .hljs-symbol,
        .tiptap-editor .hljs-bullet {
          color: #005cc5 !important;
        }

        .tiptap-editor .hljs-built_in,
        .tiptap-editor .hljs-builtin-name {
          color: #005cc5 !important;
        }

        .tiptap-editor .hljs-meta {
          color: #005cc5 !important;
        }

        .tiptap-editor .hljs-deletion {
          background: #ffeef0 !important;
        }

        .tiptap-editor .hljs-addition {
          background: #f0fff4 !important;
        }

        .tiptap-editor .hljs-emphasis {
          font-style: italic !important;
        }

        .tiptap-editor .hljs-strong {
          font-weight: bold !important;
        }

        /* Dark mode colors */
        .dark .tiptap-editor .hljs-comment,
        .dark .tiptap-editor .hljs-quote {
          color: #8b949e !important;
          font-style: italic !important;
        }

        .dark .tiptap-editor .hljs-keyword,
        .dark .tiptap-editor .hljs-selector-tag,
        .dark .tiptap-editor .hljs-subst {
          color: #ff7b72 !important;
          font-weight: bold !important;
        }

        .dark .tiptap-editor .hljs-number,
        .dark .tiptap-editor .hljs-literal,
        .dark .tiptap-editor .hljs-variable,
        .dark .tiptap-editor .hljs-template-variable,
        .dark .tiptap-editor .hljs-tag .hljs-attr {
          color: #79c0ff !important;
        }

        .dark .tiptap-editor .hljs-string,
        .dark .tiptap-editor .hljs-doctag {
          color: #a5d6ff !important;
        }

        .dark .tiptap-editor .hljs-title,
        .dark .tiptap-editor .hljs-section,
        .dark .tiptap-editor .hljs-selector-id {
          color: #d2a8ff !important;
          font-weight: bold !important;
        }

        .dark .tiptap-editor .hljs-subst {
          font-weight: normal !important;
        }

        .dark .tiptap-editor .hljs-type,
        .dark .tiptap-editor .hljs-class .hljs-title {
          color: #ff7b72 !important;
          font-weight: bold !important;
        }

        .dark .tiptap-editor .hljs-tag,
        .dark .tiptap-editor .hljs-name,
        .dark .tiptap-editor .hljs-attribute {
          color: #7ee787 !important;
          font-weight: normal !important;
        }

        .dark .tiptap-editor .hljs-regexp,
        .dark .tiptap-editor .hljs-link {
          color: #ffa657 !important;
        }

        .dark .tiptap-editor .hljs-symbol,
        .dark .tiptap-editor .hljs-bullet {
          color: #79c0ff !important;
        }

        .dark .tiptap-editor .hljs-built_in,
        .dark .tiptap-editor .hljs-builtin-name {
          color: #79c0ff !important;
        }

        .dark .tiptap-editor .hljs-meta {
          color: #79c0ff !important;
        }

        .dark .tiptap-editor .hljs-deletion {
          background: #490202 !important;
        }

        .dark .tiptap-editor .hljs-addition {
          background: #04260f !important;
        }

        .dark .tiptap-editor .hljs-emphasis {
          font-style: italic !important;
        }

        .dark .tiptap-editor .hljs-strong {
          font-weight: bold !important;
        }

        /* ===== Language Label Styles ===== */
        .tiptap-editor pre[data-language] {
          position: relative !important;
        }

        .tiptap-editor pre[data-language]::before {
          content: attr(data-language) !important;
          position: absolute !important;
          top: 0.5rem !important;
          right: 0.5rem !important;
          background: rgba(0, 0, 0, 0.1) !important;
          color: rgba(0, 0, 0, 0.6) !important;
          padding: 0.2rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          z-index: 10 !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        .dark .tiptap-editor pre[data-language]::before {
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.6) !important;
        }

        /* コードブロック内の全ての段落とテキストの左端統一 */
        .tiptap-editor pre *,
        .tiptap-editor pre p,
        .tiptap-editor pre span,
        .tiptap-editor pre div {
          text-align: left !important;
          text-indent: 0 !important;
          margin-left: 0 !important;
        }

        /* コードブロック内での改行の統一 */
        .tiptap-editor pre br {
          line-height: 1.5 !important;
        }

        /* コードブロック内のスパン要素の位置統一 */
        .tiptap-editor pre span {
          display: inline !important;
          vertical-align: baseline !important;
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
          table-layout: fixed !important; /* 固定レイアウト */
        }

        .tiptap-editor th,
        .tiptap-editor td {
          border: 1px solid rgba(148, 163, 184, 0.3) !important;
          padding: 0.5em !important;
          text-align: left !important;
          word-wrap: break-word !important; /* 長いテキストを折り返し */
          overflow-wrap: break-word !important;
          vertical-align: top !important;
          min-width: 120px !important; /* 最小幅を設定 */
        }

        .tiptap-editor th {
          background: rgba(148, 163, 184, 0.1) !important;
          font-weight: bold !important;
        }

        /* テーブルセルの編集可能状態でのスタイル */
        .tiptap-editor table p {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* テーブルのリサイズ可能な列 */
        .tiptap-editor .tableWrapper {
          overflow-x: auto !important;
          margin: 1em 0 !important;
        }

        .tiptap-editor .resize-cursor {
          cursor: col-resize !important;
        }

        /* テーブルの選択状態のスタイル */
        .tiptap-editor .selectedCell {
          background: rgba(59, 130, 246, 0.2) !important;
        }

        /* テーブルのホバー状態 */
        .tiptap-editor table:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }

        /* テーブルのアクティブな状態 */
        .tiptap-editor table .has-focus {
          outline: 2px solid rgba(59, 130, 246, 0.5) !important;
          outline-offset: 2px !important;
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

      {/* 言語選択モーダル */}
      <CodeLanguageSelectModal
        isOpen={isCodeLanguageSelectVisible}
        onClose={() => setIsCodeLanguageSelectVisible(false)}
        onSelect={(language) => {
          const currentEditor = activeEditorInstance || editor;
          if (currentEditor) {
            currentEditor.chain().focus().toggleCodeBlock({ language }).run();
          }
        }}
      />
    </div>
  );
}
