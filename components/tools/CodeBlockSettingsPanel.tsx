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
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
          コードブロック設定
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

      <div className="space-y-3">
        <div>
          <Label htmlFor="language-select" className="text-sm">
            プログラミング言語
          </Label>
          <Select
            value={
              COMMON_LANGUAGES.some((lang) => lang.value === currentLanguage)
                ? currentLanguage
                : "custom"
            }
            onValueChange={handleLanguageSelect}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">カスタム言語...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* カスタム言語入力 */}
        {(!COMMON_LANGUAGES.some((lang) => lang.value === currentLanguage) ||
          customLanguage) && (
          <div>
            <Label htmlFor="custom-language" className="text-sm">
              カスタム言語名
            </Label>
            <Input
              id="custom-language"
              value={customLanguage || currentLanguage}
              onChange={(e) => handleCustomLanguageChange(e.target.value)}
              placeholder="言語名を入力..."
              className="mt-1"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeCodeBlock}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            コードブロックを解除
          </Button>
        </div>
      </div>
    </div>
  );
}
