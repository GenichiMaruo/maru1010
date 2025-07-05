"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Minus, Maximize2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorWindow, FileTab } from "@/hooks/useFileManager";

interface FloatingWindowProps {
  window: EditorWindow;
  file: FileTab | null;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onUpdatePosition: (
    windowId: string,
    position: { x: number; y: number }
  ) => void;
  onUpdateSize: (
    windowId: string,
    size: { width: number; height: number }
  ) => void;
  onContentChange: (fileId: string, content: string) => void;
}

export function FloatingWindow({
  window,
  file,
  onClose,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
  onContentChange,
}: FloatingWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: window.size.width,
    height: window.size.height,
  });
  const windowRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Underline],
    content: file?.content || "",
    onUpdate: ({ editor }) => {
      if (file) {
        onContentChange(file.id, editor.getHTML());
      }
    },
  });

  // ドラッグ開始
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target !== e.currentTarget &&
        !(e.target as HTMLElement).closest(".window-header")
      )
        return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y,
      });
      e.preventDefault();
    },
    [window.position]
  );

  // リサイズ開始
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: window.size.width,
        height: window.size.height,
      });
      e.preventDefault();
      e.stopPropagation();
    },
    [window.size]
  );

  // マウス移動の処理
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };

        // 画面外に出ないように制限
        newPosition.x = Math.max(
          0,
          Math.min(newPosition.x, globalThis.innerWidth - window.size.width)
        );
        newPosition.y = Math.max(
          0,
          Math.min(newPosition.y, globalThis.innerHeight - window.size.height)
        );

        onUpdatePosition(window.id, newPosition);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newSize = {
          width: Math.max(300, resizeStart.width + deltaX),
          height: Math.max(200, resizeStart.height + deltaY),
        };

        onUpdateSize(window.id, newSize);
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      window.id,
      window.size,
      onUpdatePosition,
      onUpdateSize,
    ]
  );

  // マウスアップの処理
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // イベントリスナーの設定
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // ファイル内容が変更されたときにエディターを更新
  React.useEffect(() => {
    if (editor && file && editor.getHTML() !== file.content) {
      editor.commands.setContent(file.content);
    }
  }, [editor, file]);

  if (window.isMinimized) {
    return (
      <div
        className="fixed bottom-4 left-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 cursor-pointer z-50"
        onClick={() => onMinimize(window.id)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {file?.name || "Untitled Window"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-40 flex flex-col"
      style={{
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
      }}
    >
      {/* ウィンドウヘッダー */}
      <div
        className="window-header flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-lg cursor-move"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {file?.name || "Empty Window"}
          </span>
          {file?.isDirty && (
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMinimize(window.id)}
            className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(window.id)}
            className="h-6 w-6 p-0 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* エディター領域 */}
      <div className="flex-1 p-4 overflow-hidden">
        {file ? (
          <div className="h-full">
            <EditorContent
              editor={editor}
              className="h-full overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <Maximize2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ファイルをドラッグ&ドロップして開始</p>
            </div>
          </div>
        )}
      </div>

      {/* リサイズハンドル */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-slate-300 dark:bg-slate-600 rounded-tl-md opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
