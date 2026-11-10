"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Editor } from "@tiptap/core";
import { Copy, Download, FilePlus2, FolderOpen, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { IMPORT_ACCEPT } from "./io";
import { StatsPanel } from "./StatsPanel";
import type { ProFile, Workspace } from "./store";

export type ExportKind = "txt" | "md" | "html" | "latex" | "backup" | "copy";

const iconButton =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

const Heading = ({ children, actions }: { children: string; actions?: React.ReactNode }) => (
  <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-secondary/50 pr-1.5 pl-3">
    <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{children}</h2>
    {actions && <div className="flex items-center gap-0.5">{actions}</div>}
  </div>
);

export function Sidebar({
  ws,
  activeFile,
  editor,
  onOpen,
  onNewFile,
  onRename,
  onDuplicate,
  onDelete,
  onMove,
  onTargetChange,
  onImport,
  onExport,
}: {
  ws: Workspace;
  activeFile: ProFile;
  editor: Editor | null;
  onOpen: (id: string) => void;
  onNewFile: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onTargetChange: (target: number) => void;
  onImport: (files: FileList) => void;
  onExport: (kind: ExportKind) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commitRename = (id: string, value: string) => {
    const name = value.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  };

  return (
    <aside className="flex h-full w-72 max-w-[85vw] shrink-0 flex-col border-r border-border bg-card" aria-label="文書と統計">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border pr-1.5 pl-3">
        <p className="truncate font-mono text-xs">
          <Link href="/tools#charcount" className="text-syntax-keyword transition-colors hover:text-brand" title="ツール一覧へ戻る">
            ~/tools
          </Link>
          <span className="text-foreground">/char-count-pro</span>
        </p>
        <ModeToggle />
      </div>

      {/* 文書一覧 */}
      <Heading
        actions={
          <>
            <button type="button" className={iconButton} title="新しい文書" aria-label="新しい文書" onClick={onNewFile}>
              <FilePlus2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={iconButton}
              title="ファイルを読み込む（.txt / .md / .html / .json）"
              aria-label="ファイルを読み込む"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={IMPORT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onImport(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        }
      >
        files
      </Heading>
      <ul className="max-h-[35%] min-h-16 shrink-0 overflow-y-auto py-1" onDragLeave={() => setDropIndex(null)}>
        {ws.files.map((file, index) => {
          const paneIndex = ws.panes.indexOf(file.id);
          const current = file.id === activeFile.id;
          return (
            <li
              key={file.id}
              draggable={renamingId !== file.id}
              onDragStart={(e) => {
                setDragIndex(index);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                setDropIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) onMove(dragIndex, index);
                setDragIndex(null);
                setDropIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDropIndex(null);
              }}
              className={cn(
                "group relative flex h-8 items-center gap-1 pr-1.5 pl-3 text-sm",
                current ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
                dropIndex === index && dragIndex !== index && "shadow-[inset_0_2px_0_var(--syntax-type)]"
              )}
            >
              {current && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-syntax-string" />}
              {renamingId === file.id ? (
                <input
                  autoFocus
                  defaultValue={file.name}
                  aria-label="文書の名前"
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => commitRename(file.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") commitRename(file.id, e.currentTarget.value);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="h-6 min-w-0 flex-1 rounded border border-ring bg-card px-1.5 text-sm text-foreground outline-none"
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpen(file.id)}
                    onDoubleClick={() => setRenamingId(file.id)}
                    title={`${file.name}（ダブルクリックで名前を変更）`}
                    className="flex h-full min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:underline"
                  >
                    <span className="truncate">{file.name}</span>
                    {paneIndex !== -1 && ws.panes[1] && (
                      <span className="shrink-0 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
                        {paneIndex === 0 ? "左" : "右"}
                      </span>
                    )}
                  </button>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums group-focus-within:hidden group-hover:hidden [@media(hover:none)]:hidden">
                    {file.chars.toLocaleString()}
                  </span>
                  <span className="hidden shrink-0 items-center group-focus-within:flex group-hover:flex [@media(hover:none)]:flex">
                    <button type="button" className={iconButton} title="名前を変更" aria-label={`${file.name} の名前を変更`} onClick={() => setRenamingId(file.id)}>
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button type="button" className={iconButton} title="複製" aria-label={`${file.name} を複製`} onClick={() => onDuplicate(file.id)}>
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className={cn(iconButton, "hover:text-syntax-tag")}
                      title="削除"
                      aria-label={`${file.name} を削除`}
                      onClick={() => onDelete(file.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {/* 統計 */}
      <div className="border-t border-border">
        <Heading>stats</Heading>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="truncate px-3 pt-2 font-mono text-[11px] text-syntax-comment">{`// ${activeFile.name}`}</p>
        <StatsPanel editor={editor} target={activeFile.target} onTargetChange={onTargetChange} />
      </div>

      {/* 書き出し */}
      <div className="shrink-0 border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-border bg-card font-mono text-xs text-foreground transition-colors hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              書き出し・コピー
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64">
            <DropdownMenuItem onSelect={() => onExport("copy")}>テキストをコピー</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onExport("txt")}>テキスト (.txt)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport("md")}>Markdown (.md)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport("html")}>HTML (.html)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport("latex")}>LaTeX (.tex)…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onExport("backup")}>すべての文書をバックアップ (.json)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
