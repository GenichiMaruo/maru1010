"use client";

import React, { useEffect, useState } from "react";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
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
import { FontSizeExtension, VisibilityExtension } from "./extensions";
import type { EditorPane } from "@/hooks/useEditorLayout";
import type { FileTab } from "@/hooks/useFileManager";
import { Button } from "@/components/ui/button";

const lowlight = createLowlight(common);

interface SplitEditorPaneProps {
  pane: EditorPane;
  files: FileTab[];
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onSplit: (direction: "horizontal" | "vertical") => void;
  onContentChange: (fileId: string, content: string) => void;
  onFileTabClose: (fileId: string) => void;
  onFileTabActivate: (fileId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  onTabMove?: (
    sourcePane: string,
    targetPane: string,
    fileId: string,
    targetIndex?: number
  ) => void;
  onEditorReady?: (paneId: string, editor: Editor | null) => void;
  showNewlineMarkers?: boolean;
  showFullWidthSpaces?: boolean;
}

export function SplitEditorPane({
  pane,
  files,
  isActive,
  onActivate,
  onClose,
  onSplit,
  onContentChange,
  onFileTabClose,
  onFileTabActivate,
  onTabReorder,
  onTabMove,
  onEditorReady,
  showNewlineMarkers = false,
  showFullWidthSpaces = false,
}: SplitEditorPaneProps) {
  // ドラッグ&ドロップのステート
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOverPane, setIsDragOverPane] = useState(false);

  // ペインのファイル情報を取得
  const paneFiles = pane.fileIds
    .map((id) => files.find((f) => f.id === id))
    .filter(Boolean) as FileTab[];
  const activeFile = pane.activeFileId
    ? files.find((f) => f.id === pane.activeFileId) || null
    : null;

  // 存在しないファイルIDをクリーンアップ
  const validFileIds = pane.fileIds.filter((id) =>
    files.some((f) => f.id === id)
  );
  if (validFileIds.length !== pane.fileIds.length) {
    // 無効なファイルIDがある場合は、validFileIdsで更新
    // ただし、これは副作用なので、useEffectで処理する必要がある
  }

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    const file = paneFiles[index];
    if (!file) return;
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // ドラッグデータを設定（ファイルIDとソースペインIDを含む）
    const dragData = {
      fileId: file.id,
      sourcePane: pane.id,
      sourceIndex: index,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.setData("text/plain", file.id); // フォールバック
  };

  // ドラッグオーバー（タブ上）
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    // データ転送の種類をチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合のみ処理
    if (hasTabData && !hasFiles) {
      e.dataTransfer.dropEffect = "move";

      // 同一ペイン内のドラッグの場合は、位置交換可能なタブにハイライト
      if (draggedTabIndex !== null) {
        // ドラッグ中のタブと異なる位置であれば常にハイライト（先頭との交換も含む）
        if (draggedTabIndex !== index) {
          setDragOverIndex(index);
        }
      } else {
        // 異なるペイン間のドラッグの場合は常にドラッグオーバー表示
        setDragOverIndex(index);
      }
    }
  };

  // ペイン全体のドラッグオーバー
  const handlePaneDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // データ転送の種類をチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合のみ処理
    if (hasTabData && !hasFiles) {
      e.dataTransfer.dropEffect = "move";

      try {
        const dragDataStr = e.dataTransfer.getData("application/json");
        if (dragDataStr) {
          const dragData = JSON.parse(dragDataStr);
          // 異なるペインからのドラッグの場合のみハイライト
          if (dragData.sourcePane !== pane.id) {
            setIsDragOverPane(true);
          }
        }
      } catch {
        // JSON解析に失敗した場合でもタブデータがある場合はハイライト
        setIsDragOverPane(true);
      }
    }
  };

  // ペインからのドラッグリーブ
  const handlePaneDragLeave = (e: React.DragEvent) => {
    // ペインの境界から完全に出た場合のみリセット
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverPane(false);
      setDragOverIndex(null);
    }
  };

  // ドラッグ進入
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    // データ転送の種類をチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合のみ処理
    if (hasTabData && !hasFiles) {
      // 同一ペイン内のドラッグの場合は、位置交換可能なタブにハイライト
      if (draggedTabIndex !== null) {
        // ドラッグ中のタブと異なる位置であれば常にハイライト（先頭との交換も含む）
        if (draggedTabIndex !== index) {
          setDragOverIndex(index);
        }
      } else {
        // 異なるペイン間のドラッグの場合は常にドラッグオーバー表示
        setDragOverIndex(index);
      }
    }
  };

  // ドラッグリーブ
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // ドロップ（タブ上）
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // イベントの伝播を停止

    // データ転送の種類をチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合のみ処理
    if (hasTabData && !hasFiles) {
      try {
        const dragDataStr = e.dataTransfer.getData("application/json");

        if (dragDataStr) {
          const dragData = JSON.parse(dragDataStr);
          const { fileId, sourcePane, sourceIndex } = dragData;

          if (sourcePane === pane.id) {
            // 同一ペイン内でのタブ並び替え
            if (sourceIndex !== dropIndex && onTabReorder) {
              onTabReorder(sourceIndex, dropIndex);
            }
          } else {
            // 異なるペイン間でのタブ移動
            if (onTabMove) {
              onTabMove(sourcePane, pane.id, fileId, dropIndex);
            }
          }
        } else {
          // フォールバック: 従来の同一ペイン内並び替え
          if (
            draggedTabIndex !== null &&
            draggedTabIndex !== dropIndex &&
            onTabReorder
          ) {
            onTabReorder(draggedTabIndex, dropIndex);
          }
        }
      } catch {
        // フォールバック処理
        if (
          draggedTabIndex !== null &&
          draggedTabIndex !== dropIndex &&
          onTabReorder
        ) {
          onTabReorder(draggedTabIndex, dropIndex);
        }
      }
    }

    // 状態をリセット
    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setIsDragOverPane(false);
  };

  // ペインにドロップ
  const handlePaneDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // データ転送の種類をチェック
    const hasTabData = e.dataTransfer.types.includes("application/json");
    const hasFiles = e.dataTransfer.types.includes("Files");

    // タブのドラッグ&ドロップの場合のみ処理
    if (hasTabData && !hasFiles) {
      try {
        const dragDataStr = e.dataTransfer.getData("application/json");

        if (dragDataStr) {
          const dragData = JSON.parse(dragDataStr);
          const { fileId, sourcePane } = dragData;

          if (sourcePane !== pane.id && onTabMove) {
            // 異なるペインからのタブをこのペインの最後に追加
            onTabMove(sourcePane, pane.id, fileId);
          }
        }
      } catch {
        // エラーハンドリング
      }
    }

    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setIsDragOverPane(false);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setIsDragOverPane(false);
  };

  // タブのクリック処理（ドラッグ中はクリックを無効化）
  const handleTabClick = (fileId: string) => {
    if (draggedTabIndex === null) {
      onFileTabActivate(fileId);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      TextStyle,
      Underline,
      Strike,
      FontSizeExtension,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
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
      Mathematics,
      VisibilityExtension.configure({
        showParagraphMarkers: false,
        showNewlineMarkers,
        showFullWidthSpaces,
      }),
    ],
    content: activeFile?.content || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        style: `line-height: 1.6; padding: 1rem; min-height: 100%;`,
        spellcheck: "false",
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
    onCreate: ({ editor }) => {
      onEditorReady?.(pane.id, editor);
    },
    onUpdate: ({ editor }) => {
      if (activeFile?.id) {
        const content = editor.getHTML();
        onContentChange(activeFile.id, content);
      }
    },
    immediatelyRender: false,
  });

  // エディターインスタンスが変更されたときに通知
  useEffect(() => {
    if (editor) {
      onEditorReady?.(pane.id, editor);
    }
  }, [editor, pane.id, onEditorReady]);

  // ファイル変更時にエディターの内容を更新
  useEffect(() => {
    if (editor && activeFile) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeFile.content) {
        editor.commands.setContent(activeFile.content);
      }
    }
  }, [editor, activeFile]);

  // 可視化設定の更新
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions.forEach((extension) => {
        if (extension.name === "visibility") {
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

  return (
    <div
      className={`h-full flex flex-col min-w-0 border-2 ${
        isActive ? "border-blue-500 dark:border-blue-400" : "border-transparent"
      } ${
        isDragOverPane
          ? "border-blue-300 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20"
          : ""
      } bg-white dark:bg-slate-900 transition-all`}
      onClick={onActivate}
      onDragOver={handlePaneDragOver}
      onDragLeave={handlePaneDragLeave}
      onDrop={handlePaneDrop}
    >
      {/* ペインヘッダー */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-700">
        {/* タブバー */}
        {paneFiles.length > 0 && (
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div
              className="flex-1 flex items-center overflow-x-auto scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {paneFiles.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-1 px-3 py-1.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer text-sm transition-all whitespace-nowrap relative group ${
                    file.id === activeFile?.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  } ${draggedTabIndex === index ? "opacity-50 scale-95" : ""} ${
                    dragOverIndex === index && draggedTabIndex !== index
                      ? "border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/20 transform translate-x-1 shadow-lg"
                      : ""
                  }`}
                  onClick={() => handleTabClick(file.id)}
                  style={{
                    cursor: draggedTabIndex === index ? "grabbing" : "grab",
                  }}
                >
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  {file.isDirty && (
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                  )}

                  {/* ドラッグハンドル */}
                  <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M3 5h10a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2zm0 4h10a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2zm0 4h10a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2z" />
                    </svg>
                  </div>

                  {/* 閉じるボタン - メインペインでは常に表示、サブペインではファイルが複数ある場合のみ表示 */}
                  {(pane.id === "main" || paneFiles.length > 1) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileTabClose(file.id);
                      }}
                      className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                    >
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M8 7l3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3-3-3 1-1 3 3z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ツールバー */}
        <div className="flex items-center justify-between px-3 py-1 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
              {activeFile?.name || "Untitled"}
            </span>
            {activeFile?.isDirty && (
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 分割ボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSplit("vertical");
            }}
            className="p-1 h-6 w-6"
            title="垂直分割（左右に分割）"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <rect
                x="0"
                y="0"
                width="16"
                height="16"
                stroke="currentColor"
                fill="none"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="8"
                x2="16"
                y2="8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSplit("horizontal");
            }}
            className="p-1 h-6 w-6"
            title="水平分割（上下に分割）"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <rect
                x="0"
                y="0"
                width="16"
                height="16"
                stroke="currentColor"
                fill="none"
                strokeWidth="1"
              />
              <line
                x1="8"
                y1="0"
                x2="8"
                y2="16"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Button>

          {/* 閉じるボタン（すべてのペインで表示） */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 h-6 w-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            title="ペインを閉じる"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* エディター */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {activeFile ? (
          <EditorContent
            editor={editor}
            className="h-full min-w-0 overflow-y-auto prose prose-slate dark:prose-invert max-w-none"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <p>ファイルが選択されていません</p>
              <p className="text-sm">
                サイドバーからファイルを選択してください
              </p>
            </div>
          </div>
        )}
      </div>

      {/* タブバーのスクロールバーを隠すCSS */}
      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
