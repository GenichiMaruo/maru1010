"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FaTable,
  FaImage,
  FaLink,
  FaUnlink,
  FaCheckSquare,
  FaCalculator,
  FaEye,
  FaKeyboard,
  FaEllipsisH,
} from "react-icons/fa";
import { MdOutlineSubdirectoryArrowLeft } from "react-icons/md";
import { TbBorderCorners } from "react-icons/tb";

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
  isMathModalVisible: boolean;
  setIsMathModalVisible: (visible: boolean) => void;

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
  isMathModalVisible,
  setIsMathModalVisible,
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
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [mathEquation, setMathEquation] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 画面サイズをチェックしてオーバーフローメニューの表示を決定
  useEffect(() => {
    const checkOverflow = () => {
      // この機能は将来の拡張のために残しておく
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

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
    setIsMathModalVisible(true);
  };

  const handleMathSubmit = () => {
    if (mathEquation.trim()) {
      // インライン数式として挿入
      const inlineMath = `$${mathEquation.trim()}$`;
      editor?.chain().focus().insertContent(inlineMath).run();
    }
    setMathEquation("");
    setIsMathModalVisible(false);
  };

  const handleUnlink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
  };

  // 基本ツールボタンコンポーネント
  const ToolButton = ({
    icon: Icon,
    tooltip,
    onClick,
    isActive = false,
    className = "",
    compact = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    tooltip: string;
    onClick: () => void;
    isActive?: boolean;
    className?: string;
    compact?: boolean;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={`${compact ? "h-5 w-5" : "h-6 w-6"} p-0 rounded-sm ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            } ${className}`}
          >
            <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div
      ref={toolbarRef}
      className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50 min-h-[44px]"
    >
      {/* 左側: 編集ツール */}
      <div className="flex items-center gap-1 flex-1 overflow-hidden">
        {/* 基本的なテキスト装飾 - 常に表示 */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <ToolButton
            icon={FaBold}
            tooltip="Bold (Ctrl+B)"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive("bold")}
          />
          <ToolButton
            icon={FaItalic}
            tooltip="Italic (Ctrl+I)"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive("italic")}
          />
          <ToolButton
            icon={FaUnderline}
            tooltip="Underline (Ctrl+U)"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            isActive={editor?.isActive("underline")}
          />
          <ToolButton
            icon={FaStrikethrough}
            tooltip="Strikethrough"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            isActive={editor?.isActive("strike")}
          />
        </div>

        {/* リスト - 中画面以上で表示 */}
        <div className="hidden md:flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <ToolButton
            icon={FaListUl}
            tooltip="Bullet List"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive("bulletList")}
          />
          <ToolButton
            icon={FaListOl}
            tooltip="Numbered List"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive("orderedList")}
          />
        </div>

        {/* マークダウン機能 - 大画面で表示 */}
        <div className="hidden lg:flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <ToolButton
            icon={FaHeading}
            tooltip="Heading 1 (Ctrl+Alt+1)"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor?.isActive("heading", { level: 1 })}
          />
          <ToolButton
            icon={FaCode}
            tooltip={
              editor?.isActive("codeBlock")
                ? "Code Block Settings"
                : "Code Block (Ctrl+Alt+C)"
            }
            onClick={() => {
              if (editor?.isActive("codeBlock")) {
                setIsCodeBlockMenuVisible(!isCodeBlockMenuVisible);
              } else {
                editor?.chain().focus().toggleCodeBlock().run();
              }
            }}
            isActive={editor?.isActive("codeBlock") || isCodeBlockMenuVisible}
          />
          <ToolButton
            icon={FaQuoteRight}
            tooltip="Blockquote (Ctrl+Shift+B)"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive("blockquote")}
          />
        </div>

        {/* 高度な機能 - 特大画面で表示 */}
        <div className="hidden xl:flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <ToolButton
            icon={FaTable}
            tooltip={
              editor?.isActive("table") ? "Table Operations" : "Insert Table"
            }
            onClick={() => {
              if (editor?.isActive("table")) {
                setIsTableMenuVisible(!isTableMenuVisible);
              } else {
                editor
                  ?.chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              }
            }}
            isActive={editor?.isActive("table") || isTableMenuVisible}
          />
          <ToolButton
            icon={FaCheckSquare}
            tooltip="Task List"
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            isActive={editor?.isActive("taskList")}
          />
          <ToolButton
            icon={FaImage}
            tooltip="Insert Image (Upload or URL)"
            onClick={handleImageInsert}
          />
          <ToolButton
            icon={FaLink}
            tooltip="Insert/Edit Link"
            onClick={onLinkClick}
            isActive={editor?.isActive("link")}
          />
        </div>

        {/* 表示設定 - 特大画面で表示 */}
        <div className="hidden xl:flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullWidthSpaces(!showFullWidthSpaces)}
                  className={`h-6 w-6 p-0 rounded-sm ${
                    showFullWidthSpaces
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <TbBorderCorners className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show Full-width Spaces</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ToolButton
            icon={MdOutlineSubdirectoryArrowLeft}
            tooltip="Show Line Breaks"
            onClick={() => setShowNewlineMarkers(!showNewlineMarkers)}
            isActive={showNewlineMarkers}
          />
        </div>

        {/* オーバーフローメニュー */}
        <DropdownMenu
          open={isOverflowMenuOpen}
          onOpenChange={setIsOverflowMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
            >
              <FaEllipsisH className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {/* 中画面未満で隠れるアイテム */}
            <div className="md:hidden">
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <FaListUl className="w-3 h-3 mr-2" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
              >
                <FaListOl className="w-3 h-3 mr-2" />
                Numbered List
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

            {/* 大画面未満で隠れるアイテム */}
            <div className="lg:hidden">
              <DropdownMenuItem
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <FaHeading className="w-3 h-3 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              >
                <FaCode className="w-3 h-3 mr-2" />
                Code Block
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              >
                <FaQuoteRight className="w-3 h-3 mr-2" />
                Blockquote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

            {/* 特大画面未満で隠れるアイテム */}
            <div className="xl:hidden">
              <DropdownMenuItem
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
              >
                <FaTable className="w-3 h-3 mr-2" />
                Insert Table
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
              >
                <FaCheckSquare className="w-3 h-3 mr-2" />
                Task List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImageInsert}>
                <FaImage className="w-3 h-3 mr-2" />
                Insert Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLinkClick}>
                <FaLink className="w-3 h-3 mr-2" />
                Insert Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowFullWidthSpaces(!showFullWidthSpaces)}
                className="flex items-center"
              >
                <TbBorderCorners className="w-3 h-3 mr-2" />
                Show Full-width Spaces
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowNewlineMarkers(!showNewlineMarkers)}
              >
                <MdOutlineSubdirectoryArrowLeft className="w-3 h-3 mr-2" />
                Show Line Breaks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

            {/* その他の機能 - 常に表示 */}
            <DropdownMenuItem onClick={handleMathInsert}>
              <FaCalculator className="w-3 h-3 mr-2" />
              Math Equation
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            >
              <FaEye className="w-3 h-3 mr-2" />
              Toggle Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsShortcutsVisible(!isShortcutsVisible)}
            >
              <FaKeyboard className="w-3 h-3 mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            {editor?.isActive("link") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUnlink}>
                  <FaUnlink className="w-3 h-3 mr-2" />
                  Remove Link
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 右側: 統計とターゲット - 常に表示 */}
      <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
        {/* Target入力 - 小画面では幅を縮小 */}
        <div className="flex items-center gap-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
            Target:
          </span>
          <span className="text-slate-600 dark:text-slate-400 font-medium sm:hidden">
            T:
          </span>
          <input
            type="number"
            value={targetLength || ""}
            onChange={(e) => setTargetLength(Number(e.target.value) || 0)}
            className="w-12 sm:w-16 h-6 px-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="0"
            min="0"
            max="999999"
          />
        </div>

        {/* 統計情報 */}
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            <span className="hidden sm:inline">{stats.characters} chars</span>
            <span className="sm:hidden">{stats.characters}c</span>
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            <span className="hidden sm:inline">{stats.words} words</span>
            <span className="sm:hidden">{stats.words}w</span>
          </span>
        </div>

        {/* プログレスバー */}
        {targetLength > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <div className="w-12 lg:w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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

      {/* Math Equation Modal */}
      <Dialog open={isMathModalVisible} onOpenChange={setIsMathModalVisible}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Math Equation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equation">LaTeX Equation</Label>
              <Input
                id="equation"
                placeholder="E = mc^2"
                value={mathEquation}
                onChange={(e) => setMathEquation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleMathSubmit();
                  } else if (e.key === "Escape") {
                    setIsMathModalVisible(false);
                  }
                }}
                autoFocus
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter a LaTeX equation. It will be wrapped in $$ delimiters.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMathEquation("");
                setIsMathModalVisible(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMathSubmit} disabled={!mathEquation.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
