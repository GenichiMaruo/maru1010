"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LaTeXExportOptions } from "@/utils/latexExport";

interface LaTeXExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: LaTeXExportOptions, content: string) => void;
  content: string;
  filename: string;
}

const defaultOptions: LaTeXExportOptions = {
  engine: "lualatex",
  documentClass: "jlreq",
  fontSize: "12pt",
  paperSize: "a4paper",
  margin: "normal",
  includeTitle: true,
  title: "",
  author: "",
  date: "\\today",
  includeToc: false,
  mathPackage: "amsmath",
  encoding: "utf8",
  language: "japanese",
  bibliography: false,
  hyperref: true,
  colorlinks: true,
};

export default function LaTeXExportModal({
  isOpen,
  onClose,
  onExport,
  content,
  filename,
}: LaTeXExportModalProps) {
  const [options, setOptions] = useState<LaTeXExportOptions>(defaultOptions);

  const handleExport = () => {
    onExport(options, content);
    onClose();
  };

  const updateOption = <K extends keyof LaTeXExportOptions>(
    key: K,
    value: LaTeXExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const isJapanese =
    options.language === "japanese" || options.language === "both";
  const recommendedEngine = isJapanese ? "lualatex" : "pdflatex";
  const recommendedClass = isJapanese ? "jlreq" : "article";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LaTeX Export Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Engine Selection */}
          <div className="space-y-2">
            <Label htmlFor="engine">LaTeX Engine</Label>
            <Select
              value={options.engine}
              onValueChange={(value) =>
                updateOption("engine", value as typeof options.engine)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lualatex">
                  LuaLaTeX (推奨: 日本語)
                </SelectItem>
                <SelectItem value="xelatex">XeLaTeX</SelectItem>
                <SelectItem value="pdflatex">pdfLaTeX</SelectItem>
              </SelectContent>
            </Select>
            {options.engine !== recommendedEngine && isJapanese && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                日本語文書には{recommendedEngine}が推奨されます
              </p>
            )}
          </div>

          {/* Document Class */}
          <div className="space-y-2">
            <Label htmlFor="documentClass">Document Class</Label>
            <Select
              value={options.documentClass}
              onValueChange={(value) =>
                updateOption(
                  "documentClass",
                  value as typeof options.documentClass
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jlreq">jlreq (推奨: 日本語)</SelectItem>
                <SelectItem value="ltjsarticle">ltjsarticle</SelectItem>
                <SelectItem value="ltjsreport">ltjsreport</SelectItem>
                <SelectItem value="ltjsbook">ltjsbook</SelectItem>
                <SelectItem value="article">article</SelectItem>
                <SelectItem value="report">report</SelectItem>
                <SelectItem value="book">book</SelectItem>
              </SelectContent>
            </Select>
            {options.documentClass !== recommendedClass && isJapanese && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                日本語文書には{recommendedClass}が推奨されます
              </p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={options.language}
              onValueChange={(value) =>
                updateOption("language", value as typeof options.language)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="both">Japanese + English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select
              value={options.fontSize}
              onValueChange={(value) =>
                updateOption("fontSize", value as typeof options.fontSize)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10pt">10pt</SelectItem>
                <SelectItem value="11pt">11pt</SelectItem>
                <SelectItem value="12pt">12pt</SelectItem>
                <SelectItem value="14pt">14pt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paper Size */}
          <div className="space-y-2">
            <Label htmlFor="paperSize">Paper Size</Label>
            <Select
              value={options.paperSize}
              onValueChange={(value) =>
                updateOption("paperSize", value as typeof options.paperSize)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4paper">A4</SelectItem>
                <SelectItem value="letterpaper">Letter</SelectItem>
                <SelectItem value="a5paper">A5</SelectItem>
                <SelectItem value="b5paper">B5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <Label htmlFor="margin">Margin</Label>
            <Select
              value={options.margin}
              onValueChange={(value) =>
                updateOption("margin", value as typeof options.margin)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="narrow">Narrow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {options.margin === "custom" && (
              <Input
                placeholder="e.g., 2cm"
                value={options.customMargin || ""}
                onChange={(e) => updateOption("customMargin", e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Title Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeTitle"
              checked={options.includeTitle}
              onChange={(e) => updateOption("includeTitle", e.target.checked)}
              className="rounded border border-slate-300"
            />
            <Label htmlFor="includeTitle">Include Title Page</Label>
          </div>

          {options.includeTitle && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  placeholder={filename || "Document Title"}
                  value={options.title}
                  onChange={(e) => updateOption("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  placeholder="Author Name"
                  value={options.author}
                  onChange={(e) => updateOption("author", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  placeholder="\\today"
                  value={options.date}
                  onChange={(e) => updateOption("date", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <h4 className="font-medium">Additional Options</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeToc"
                checked={options.includeToc}
                onChange={(e) => updateOption("includeToc", e.target.checked)}
                className="rounded border border-slate-300"
              />
              <Label htmlFor="includeToc">Table of Contents</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bibliography"
                checked={options.bibliography}
                onChange={(e) => updateOption("bibliography", e.target.checked)}
                className="rounded border border-slate-300"
              />
              <Label htmlFor="bibliography">Bibliography</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hyperref"
                checked={options.hyperref}
                onChange={(e) => updateOption("hyperref", e.target.checked)}
                className="rounded border border-slate-300"
              />
              <Label htmlFor="hyperref">Hyperlinks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="colorlinks"
                checked={options.colorlinks}
                onChange={(e) => updateOption("colorlinks", e.target.checked)}
                className="rounded border border-slate-300"
              />
              <Label htmlFor="colorlinks">Colored Links</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mathPackage">Math Package</Label>
            <Select
              value={options.mathPackage}
              onValueChange={(value) =>
                updateOption("mathPackage", value as typeof options.mathPackage)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amsmath">amsmath</SelectItem>
                <SelectItem value="mathtools">mathtools</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export LaTeX</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
