"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeLanguageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (language: string) => void;
}

// よく使われるプログラミング言語のリスト
const POPULAR_LANGUAGES = [
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
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "plaintext", label: "Plain Text" },
];

export function CodeLanguageSelectModal({
  isOpen,
  onClose,
  onSelect,
}: CodeLanguageSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLanguages = POPULAR_LANGUAGES.filter(
    (lang) =>
      lang.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (language: string) => {
    onSelect(language);
    onClose();
    setSearchTerm(""); // 検索をリセット
  };

  const handleClose = () => {
    onClose();
    setSearchTerm(""); // 検索をリセット
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>プログラミング言語を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="言語を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <ScrollArea className="h-96">
            <div className="grid grid-cols-2 gap-2">
              {filteredLanguages.map((lang) => (
                <Button
                  key={lang.value}
                  variant="outline"
                  className="justify-start h-auto py-2"
                  onClick={() => handleSelect(lang.value)}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{lang.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {lang.value}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>該当する言語が見つかりません</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => handleSelect(searchTerm)}
                >
                  &quot;{searchTerm}&quot; をカスタム言語として使用
                </Button>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
