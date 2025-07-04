/**
 * Text transformation tools for the CharCountProEditor
 */

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FaLanguage,
  FaRegComments,
  FaEraser,
  FaMinus,
  FaRegCopy,
  FaCheck,
} from "react-icons/fa";
import {
  applyCaseConversion,
  removeNewlines,
  clearFormatting,
  removeComments,
  normalizeWhitespace,
  copyToClipboard,
} from "@/utils/editorOperations";
import {
  CaseConversionType,
  CommentLanguage,
} from "@/utils/textTransformUtils";
import { CommentRemovalModal } from "./CommentRemovalModal";

interface TextTransformToolsProps {
  editor: Editor | null;
  onUpdate?: () => void;
  className?: string;
}

export function TextTransformTools({
  editor,
  onUpdate,
  className,
}: TextTransformToolsProps) {
  const [copied, setCopied] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const handleCaseConversion = (caseType: CaseConversionType) => {
    if (!editor) return;
    applyCaseConversion(editor, caseType, onUpdate);
  };

  const handleRemoveNewlines = () => {
    if (!editor) return;
    removeNewlines(editor, onUpdate);
  };

  const handleClearFormatting = () => {
    if (!editor) return;
    clearFormatting(editor, onUpdate);
  };

  const handleRemoveComments = (language: CommentLanguage) => {
    if (!editor) return;
    removeComments(editor, language, onUpdate);
  };

  const handleNormalizeWhitespace = () => {
    if (!editor) return;
    normalizeWhitespace(editor, onUpdate);
  };

  const handleCopyToClipboard = async () => {
    if (!editor) return;

    const success = await copyToClipboard(editor);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // editorがnullでもボタンは表示する（他のツールバーボタンと同じ動作）
  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      {/* Case Conversion Dropdown */}
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild disabled={!editor}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!editor}
                  className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <FaLanguage className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Case Conversion</TooltipContent>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => handleCaseConversion("camelCase")}
              >
                camelCase
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCaseConversion("PascalCase")}
              >
                PascalCase
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCaseConversion("snake_case")}
              >
                snake_case
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCaseConversion("kebab-case")}
              >
                kebab-case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>

      {/* Comment Removal */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={() => setIsCommentModalOpen(true)}
              className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <FaRegComments className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove Comments</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Text Operations */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={handleRemoveNewlines}
              className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <FaMinus className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove Newlines</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={handleClearFormatting}
              className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <FaEraser className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Formatting</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Copy to Clipboard */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={handleCopyToClipboard}
              className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {copied ? (
                <FaCheck className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <FaRegCopy className="w-3.5 h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? "Copied!" : "Copy to Clipboard"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Comment Removal Modal */}
      <CommentRemovalModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onRemoveComments={handleRemoveComments}
        onNormalizeWhitespace={handleNormalizeWhitespace}
      />
    </div>
  );
}
