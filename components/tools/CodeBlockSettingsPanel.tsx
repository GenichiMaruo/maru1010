"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CodeBlockSettingsPanelProps {
  editor: Editor | null;
  isVisible: boolean;
  onClose: () => void;
}

// よく使われるプログラミング言語のリスト（設定パネル用）
const COMMON_LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "diff", label: "Diff" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

export function CodeBlockSettingsPanel({
  editor,
  isVisible,
  onClose,
}: CodeBlockSettingsPanelProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("");
  const [customLanguage, setCustomLanguage] = useState<string>("");

  // 現在のコードブロックの言語を取得
  useEffect(() => {
    if (editor?.isActive("codeBlock")) {
      const attrs = editor.getAttributes("codeBlock");
      const language = attrs.language || "plaintext";
      setCurrentLanguage(language);

      // リストにない言語の場合はカスタム入力に設定
      const isCommonLanguage = COMMON_LANGUAGES.some(
        (lang) => lang.value === language
      );
      if (!isCommonLanguage) {
        setCustomLanguage(language);
      }
    }
  }, [editor, isVisible]);

  const updateLanguage = (language: string) => {
    if (editor?.isActive("codeBlock")) {
      editor.chain().focus().updateAttributes("codeBlock", { language }).run();
      setCurrentLanguage(language);
    }
  };

  const handleLanguageSelect = (language: string) => {
    if (language === "custom") {
      // カスタム言語の場合は入力欄にフォーカス
      return;
    }
    updateLanguage(language);
    setCustomLanguage(""); // カスタム入力をクリア
  };

  const handleCustomLanguageChange = (value: string) => {
    setCustomLanguage(value);
    if (value.trim()) {
      updateLanguage(value.trim());
    }
  };

  const removeCodeBlock = () => {
    if (editor?.isActive("codeBlock")) {
      // コードブロックの内容を取得
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);

      // コードブロックを削除して、プレーンテキストとして挿入
      editor.chain().focus().deleteSelection().insertContent(text).run();

      onClose();
    }
  };

  if (!isVisible || !editor?.isActive("codeBlock")) {
    return null;
  }

  return (
    <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex gap-1.5 items-center justify-between">
        {/* 左側：設定項目 */}
        <div className="flex gap-1.5 items-center">
          {/* 言語選択 */}
          <div className="flex items-center gap-1">
            <Label
              htmlFor="language-select"
              className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap"
            >
              言語:
            </Label>
            <Select
              value={
                COMMON_LANGUAGES.some((lang) => lang.value === currentLanguage)
                  ? currentLanguage
                  : "custom"
              }
              onValueChange={handleLanguageSelect}
            >
              <SelectTrigger className="w-28 h-5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">カスタム...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* カスタム言語入力 */}
          {(!COMMON_LANGUAGES.some((lang) => lang.value === currentLanguage) ||
            customLanguage) && (
            <div className="flex items-center gap-1">
              <Label
                htmlFor="custom-language"
                className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap"
              >
                カスタム:
              </Label>
              <Input
                id="custom-language"
                value={customLanguage || currentLanguage}
                onChange={(e) => handleCustomLanguageChange(e.target.value)}
                placeholder="言語名..."
                className="w-20 h-5 text-xs"
              />
            </div>
          )}
        </div>

        {/* 右側：アクションボタン */}
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={removeCodeBlock}
            className="h-5 text-xs px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            解除
          </Button>

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
    </div>
  );
}
