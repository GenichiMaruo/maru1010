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
  FaPlus,
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
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
          テーブル操作
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      <TooltipProvider>
        <div className="space-y-3">
          {/* 行操作 */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              行操作
            </h4>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRowAbove}
                    className="flex items-center gap-1"
                  >
                    <FaArrowUp className="w-3 h-3" />
                    <FaPlus className="w-3 h-3" />
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
                    className="flex items-center gap-1"
                  >
                    <FaArrowDown className="w-3 h-3" />
                    <FaPlus className="w-3 h-3" />
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
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FaMinus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>行を削除</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 列操作 */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              列操作
            </h4>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addColumnLeft}
                    className="flex items-center gap-1"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    <FaPlus className="w-3 h-3" />
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
                    className="flex items-center gap-1"
                  >
                    <FaArrowRight className="w-3 h-3" />
                    <FaPlus className="w-3 h-3" />
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
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FaMinus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>列を削除</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* ヘッダー操作 */}
          <div>
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              ヘッダー
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHeaderRow}
                className="text-xs"
              >
                ヘッダー行切替
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHeaderColumn}
                className="text-xs"
              >
                ヘッダー列切替
              </Button>
            </div>
          </div>

          {/* テーブル全体操作 */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
            <Button
              variant="outline"
              size="sm"
              onClick={deleteTable}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
            >
              <FaTrash className="w-3 h-3" />
              テーブルを削除
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
