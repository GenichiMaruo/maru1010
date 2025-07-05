"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FaMinus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";

interface TableOperationsPanelProps {
  editor: Editor | null;
  isVisible: boolean;
  onClose: () => void;
}

export function TableOperationsPanel({
  editor,
  isVisible,
  onClose,
}: TableOperationsPanelProps) {
  if (!isVisible || !editor?.isActive("table")) {
    return null;
  }

  const addRowAbove = () => {
    editor?.chain().focus().addRowBefore().run();
  };

  const addRowBelow = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor?.chain().focus().deleteRow().run();
  };

  const addColumnLeft = () => {
    editor?.chain().focus().addColumnBefore().run();
  };

  const addColumnRight = () => {
    editor?.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor?.chain().focus().deleteColumn().run();
  };

  const deleteTable = () => {
    editor?.chain().focus().deleteTable().run();
    onClose();
  };

  const toggleHeaderRow = () => {
    editor?.chain().focus().toggleHeaderRow().run();
  };

  const toggleHeaderColumn = () => {
    editor?.chain().focus().toggleHeaderColumn().run();
  };

  return (
    <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <TooltipProvider>
        <div className="flex gap-1.5 items-center justify-between">
          {/* 左側：操作ボタン群 */}
          <div className="flex gap-1.5 items-center">
            {/* 行操作 */}
            <div className="flex gap-0.5 items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400 mr-0.5">
                行:
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRowAbove}
                    className="h-5 w-5 p-0 flex items-center justify-center"
                  >
                    <FaArrowUp className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上に行を追加</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRowBelow}
                    className="h-5 w-5 p-0 flex items-center justify-center"
                  >
                    <FaArrowDown className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>下に行を追加</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteRow}
                    className="h-5 w-5 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FaMinus className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>行を削除</TooltipContent>
              </Tooltip>
            </div>

            {/* 区切り線 */}
            <div className="h-3 border-l border-slate-300 dark:border-slate-600" />

            {/* 列操作 */}
            <div className="flex gap-0.5 items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400 mr-0.5">
                列:
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addColumnLeft}
                    className="h-5 w-5 p-0 flex items-center justify-center"
                  >
                    <FaArrowLeft className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>左に列を追加</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addColumnRight}
                    className="h-5 w-5 p-0 flex items-center justify-center"
                  >
                    <FaArrowRight className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>右に列を追加</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteColumn}
                    className="h-5 w-5 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FaMinus className="w-2 h-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>列を削除</TooltipContent>
              </Tooltip>
            </div>

            {/* 区切り線 */}
            <div className="h-3 border-l border-slate-300 dark:border-slate-600" />

            {/* ヘッダー操作 */}
            <div className="flex gap-0.5 items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400 mr-0.5">
                H:
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleHeaderRow}
                    className="h-5 px-1 text-xs"
                  >
                    行
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ヘッダー行を切替</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleHeaderColumn}
                    className="h-5 px-1 text-xs"
                  >
                    列
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ヘッダー列を切替</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 右側：削除ボタンと閉じるボタン */}
          <div className="flex gap-1 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteTable}
                  className="h-5 w-5 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FaTrash className="w-2 h-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>テーブルを削除</TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-5 w-5 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ×
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
