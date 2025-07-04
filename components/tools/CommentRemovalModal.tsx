/**
 * Modal for comment removal language selection
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommentLanguage } from "@/utils/textTransformUtils";
import { FaCode, FaHashtag, FaTag, FaCompressArrowsAlt } from "react-icons/fa";

interface CommentRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveComments: (language: CommentLanguage) => void;
  onNormalizeWhitespace: () => void;
}

const languageOptions = [
  {
    value: "generic_block_line" as CommentLanguage,
    label: "C/JavaScript",
    description: "// and /* */ comments",
    icon: FaCode,
  },
  {
    value: "hash_comments" as CommentLanguage,
    label: "Shell/Python",
    description: "# comments",
    icon: FaHashtag,
  },
  {
    value: "html_comments" as CommentLanguage,
    label: "HTML/XML",
    description: "<!-- --> comments",
    icon: FaTag,
  },
] as const;

export function CommentRemovalModal({
  isOpen,
  onClose,
  onRemoveComments,
  onNormalizeWhitespace,
}: CommentRemovalModalProps) {
  const handleLanguageSelect = (language: CommentLanguage) => {
    onRemoveComments(language);
    onClose();
  };

  const handleNormalizeWhitespace = () => {
    onNormalizeWhitespace();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Text Cleanup</DialogTitle>
          <DialogDescription>
            Select the operation you want to perform on your text.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {/* Comment Removal Options */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Remove Comments
            </div>
            {languageOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => handleLanguageSelect(option.value)}
                className="justify-start h-16 w-full py-3 px-4 flex flex-row items-center gap-3"
              >
                <option.icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <div className="flex flex-col items-start gap-1">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {option.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* Whitespace Normalization */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Text Formatting
            </div>
            <Button
              variant="outline"
              onClick={handleNormalizeWhitespace}
              className="justify-start h-16 w-full py-3 px-4 flex flex-row items-center gap-3"
            >
              <FaCompressArrowsAlt className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              <div className="flex flex-col items-start gap-1">
                <div className="font-semibold">Normalize Whitespace</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Convert all whitespace to single half-width spaces
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
