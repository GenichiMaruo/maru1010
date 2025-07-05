"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaLink, FaExternalLinkAlt, FaUnlink } from "react-icons/fa";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, text: string) => void;
  onRemove?: () => void;
  initialUrl?: string;
  initialText?: string;
  hasSelection: boolean;
  isEditMode: boolean;
}

export default function LinkModal({
  isOpen,
  onClose,
  onSave,
  onRemove,
  initialUrl = "",
  initialText = "",
  hasSelection,
  isEditMode,
}: LinkModalProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState("");

  // モーダルが開かれた時に初期値を設定
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
      setUrlError("");
    }
  }, [isOpen, initialUrl, initialText]);

  // URLバリデーション
  const validateUrl = (inputUrl: string): boolean => {
    if (!inputUrl.trim()) {
      setUrlError("URL is required");
      return false;
    }

    try {
      // URLが相対パスまたは絶対URLかチェック
      if (inputUrl.startsWith("/") || inputUrl.startsWith("#")) {
        setUrlError("");
        return true;
      }

      // 完全なURLかチェック
      const urlObj = new URL(inputUrl);
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        setUrlError("URL must start with http:// or https://");
        return false;
      }

      setUrlError("");
      return true;
    } catch {
      // プロトコルが省略されている場合は自動で追加
      if (!inputUrl.includes("://")) {
        const correctedUrl = `https://${inputUrl}`;
        try {
          new URL(correctedUrl);
          setUrl(correctedUrl);
          setUrlError("");
          return true;
        } catch {
          setUrlError("Please enter a valid URL");
          return false;
        }
      }
      setUrlError("Please enter a valid URL");
      return false;
    }
  };

  const handleSave = () => {
    if (!validateUrl(url)) {
      return;
    }

    const finalText = text.trim() || url;
    onSave(url, finalText);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      onClose();
    }
  };

  // URLプレビュー
  const getUrlPreview = () => {
    if (!url) return null;

    try {
      if (url.startsWith("/") || url.startsWith("#")) {
        return `Internal link: ${url}`;
      }
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {isEditMode ? "Edit Link" : "Insert Link"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modify the link URL and display text."
              : hasSelection
              ? "Add a URL to the selected text."
              : "Create a new link with URL and display text."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* URL入力 */}
          <div className="grid gap-2">
            <Label htmlFor="url" className="text-sm font-medium">
              URL *
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              placeholder="https://example.com or /page or #section"
              className={`${
                urlError ? "border-red-500 focus:border-red-500" : ""
              }`}
              autoFocus
            />
            {urlError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {urlError}
              </p>
            )}
            {!urlError && url && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <FaExternalLinkAlt className="w-3 h-3" />
                {getUrlPreview()}
              </p>
            )}
          </div>

          {/* テキスト入力 */}
          <div className="grid gap-2">
            <Label htmlFor="text" className="text-sm font-medium">
              Display Text
              {hasSelection && (
                <span className="text-xs text-slate-500 ml-1">
                  (uses selected text if empty)
                </span>
              )}
            </Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                hasSelection
                  ? "Leave empty to use selected text"
                  : "Link display text"
              }
            />
            {!hasSelection && !text && url && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Will use URL as display text if left empty
              </p>
            )}
          </div>

          {/* プレビュー */}
          {url && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
              <Label className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Preview
              </Label>
              <div className="mt-1">
                <a
                  href="#"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={(e) => e.preventDefault()}
                >
                  {text || (hasSelection ? initialText : url)}
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {isEditMode && onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="flex items-center gap-2"
              >
                <FaUnlink className="w-3 h-3" />
                Remove Link
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!url.trim()}
              className="flex items-center gap-2"
            >
              <FaLink className="w-3 h-3" />
              {isEditMode ? "Update Link" : "Insert Link"}
            </Button>
          </div>
        </DialogFooter>

        {/* キーボードショートカットヒント */}
        <div className="text-xs text-slate-500 dark:text-slate-400 border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span>Ctrl/Cmd + Enter: Save</span>
            <span>Escape: Cancel</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
