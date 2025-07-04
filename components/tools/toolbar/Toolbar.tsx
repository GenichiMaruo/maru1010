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
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
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
  FaExpandArrowsAlt,
} from "react-icons/fa";
import { MdOutlineSubdirectoryArrowLeft } from "react-icons/md";

interface ToolbarProps {
  editor: Editor | null;

  // Modal states
  isCodeBlockMenuVisible: boolean;
  setIsCodeBlockMenuVisible: (visible: boolean) => void;
  isTableMenuVisible: boolean;
  setIsTableMenuVisible: (visible: boolean) => void;
  isPreviewVisible: boolean;
  setIsPreviewVisible: (visible: boolean) => void;
  isShortcutsVisible: boolean;
  setIsShortcutsVisible: (visible: boolean) => void;

  // Visibility settings
  showFullWidthSpaces: boolean;
  setShowFullWidthSpaces: (show: boolean) => void;
  showNewlineMarkers: boolean;
  setShowNewlineMarkers: (show: boolean) => void;

  // Link handlers
  onLinkClick: () => void;

  // Statistics
  stats: {
    characters: number;
    words: number;
  };
  targetLength: number;
  setTargetLength: (length: number) => void;
  targetProgress: number;
}

export function Toolbar({
  editor,
  isCodeBlockMenuVisible,
  setIsCodeBlockMenuVisible,
  isTableMenuVisible,
  setIsTableMenuVisible,
  isPreviewVisible,
  setIsPreviewVisible,
  isShortcutsVisible,
  setIsShortcutsVisible,
  showFullWidthSpaces,
  setShowFullWidthSpaces,
  showNewlineMarkers,
  setShowNewlineMarkers,
  onLinkClick,
  stats,
  targetLength,
  setTargetLength,
  targetProgress,
}: ToolbarProps) {
  const handleImageInsert = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handleMathInsert = () => {
    const equation = prompt("Enter LaTeX equation (e.g., E = mc^2):");
    if (equation) {
      editor?.chain().focus().insertContent(`$$${equation}$$`).run();
    }
  };

  const handleUnlink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
  };

  return (
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
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
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
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
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
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
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
                  onClick={() => editor?.chain().focus().toggleTaskList().run()}
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
                  onClick={handleImageInsert}
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
                  onClick={onLinkClick}
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
                  onClick={handleUnlink}
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
                  onClick={handleMathInsert}
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
                  onClick={() => setShowFullWidthSpaces(!showFullWidthSpaces)}
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {stats.characters} chars
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {stats.words} words
          </span>
          {targetLength > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    targetProgress >= 100
                      ? "bg-green-500"
                      : targetProgress >= 80
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {Math.round(targetProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
