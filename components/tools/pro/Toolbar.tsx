"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  CaseSensitive,
  Code,
  Columns2,
  Eye,
  Image as ImageIcon,
  Italic,
  Keyboard,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  PanelLeft,
  Quote,
  Redo2,
  Search,
  Sigma,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline,
  Undo2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearFormatting, joinLines, transformTextNodes } from "@/components/tools/charcount/commands";
import {
  enToJpPunctuation,
  jpToEnPunctuation,
  removeComments,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toWords,
} from "@/utils/textTransformUtils";
import { cn } from "@/lib/utils";
import { CODE_LANGUAGES } from "./extensions";

const MAX_IMAGE_BYTES = 1024 * 1024;

const selectClass =
  "h-7 rounded-md border border-border bg-card px-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // エディタの選択範囲を保ったまま押せるようにする
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30",
        active ? "bg-syntax-type/15 text-syntax-type" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-border" />;

/** 行ごとに単語へ分けて、命名規則を変える */
const convertCase = (fn: (words: string[]) => string) => (text: string) =>
  text
    .split("\n")
    .map((line) => {
      const words = toWords(line);
      return words.length ? fn(words) : line;
    })
    .join("\n");

const toHalfWidth = (text: string) =>
  text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");

export function Toolbar({
  editor,
  split,
  sidebarOpen,
  showNewlines,
  showFullWidthSpaces,
  onToggleSidebar,
  onToggleSplit,
  onToggleNewlines,
  onToggleFullWidthSpaces,
  onLink,
  onMath,
  onFind,
  onShortcuts,
  onNotify,
}: {
  editor: Editor | null;
  split: boolean;
  sidebarOpen: boolean;
  showNewlines: boolean;
  showFullWidthSpaces: boolean;
  onToggleSidebar: () => void;
  onToggleSplit: () => void;
  onToggleNewlines: () => void;
  onToggleFullWidthSpaces: () => void;
  onLink: () => void;
  onMath: () => void;
  onFind: () => void;
  onShortcuts: () => void;
  onNotify: (message: string) => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      !e || e.isDestroyed ? null : {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        link: e.isActive("link"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        taskList: e.isActive("taskList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        heading: e.isActive("heading") ? String(e.getAttributes("heading").level ?? "") : "",
        fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
        hasSelection: !e.state.selection.empty,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      },
  });

  const off = !editor || !state;
  const chain = () => editor!.chain().focus();

  /** 選択範囲があればその中だけ、無ければ文書全体を変換する */
  const transform = (fn: (text: string) => string) => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    transformTextNodes(editor, fn, empty ? undefined : { from, to });
    editor.commands.focus();
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      // 画像は文書と一緒にブラウザへ保存するので、大きいと保存できなくなる
      if (file.size > MAX_IMAGE_BYTES) return onNotify("画像は 1MB 以下にしてください（ブラウザに保存するため）");
      const reader = new FileReader();
      reader.onload = () => chain().setImage({ src: String(reader.result), alt: file.name }).run();
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const scope = state && state.hasSelection ? "選択範囲" : "文書全体";

  return (
    <div className="flex shrink-0 items-start gap-1 border-b border-border bg-secondary/50 px-1.5 py-1" role="toolbar" aria-label="書式">
      <ToolButton icon={PanelLeft} label={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"} active={sidebarOpen} onClick={onToggleSidebar} />
      <Divider />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
        <ToolButton icon={Undo2} label="元に戻す (Ctrl+Z)" disabled={off || !state.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton icon={Redo2} label="やり直す (Ctrl+Y)" disabled={off || !state.canRedo} onClick={() => chain().redo().run()} />
        <Divider />

        <select
          aria-label="段落のスタイル"
          disabled={off}
          value={state?.heading ?? ""}
          onChange={(e) =>
            e.target.value
              ? chain().setHeading({ level: Number(e.target.value) as 1 | 2 | 3 }).run()
              : chain().setParagraph().run()
          }
          className={selectClass}
        >
          <option value="">本文</option>
          <option value="1">見出し 1</option>
          <option value="2">見出し 2</option>
          <option value="3">見出し 3</option>
        </select>
        <select
          aria-label="文字サイズ"
          disabled={off}
          value={state?.fontSize ?? ""}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
          className={selectClass}
        >
          <option value="12">小</option>
          <option value="">標準</option>
          <option value="18">大</option>
          <option value="24">特大</option>
        </select>
        <Divider />

        <ToolButton icon={Bold} label="太字 (Ctrl+B)" active={state?.bold} disabled={off} onClick={() => chain().toggleBold().run()} />
        <ToolButton icon={Italic} label="斜体 (Ctrl+I)" active={state?.italic} disabled={off} onClick={() => chain().toggleItalic().run()} />
        <ToolButton icon={Underline} label="下線 (Ctrl+U)" active={state?.underline} disabled={off} onClick={() => chain().toggleUnderline().run()} />
        <ToolButton icon={Strikethrough} label="取り消し線" active={state?.strike} disabled={off} onClick={() => chain().toggleStrike().run()} />
        <ToolButton icon={Code} label="インラインコード (Ctrl+E)" active={state?.code} disabled={off} onClick={() => chain().toggleCode().run()} />
        <Divider />

        <ToolButton icon={List} label="箇条書き" active={state?.bulletList} disabled={off} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton icon={ListOrdered} label="番号付きリスト" active={state?.orderedList} disabled={off} onClick={() => chain().toggleOrderedList().run()} />
        <ToolButton icon={ListChecks} label="チェックリスト" active={state?.taskList} disabled={off} onClick={() => chain().toggleTaskList().run()} />
        <ToolButton icon={Quote} label="引用" active={state?.blockquote} disabled={off} onClick={() => chain().toggleBlockquote().run()} />
        <ToolButton icon={SquareCode} label="コードブロック" active={state?.codeBlock} disabled={off} onClick={() => chain().toggleCodeBlock().run()} />
        <Divider />

        <ToolButton icon={LinkIcon} label="リンク" active={state?.link} disabled={off} onClick={onLink} />
        <ToolButton icon={ImageIcon} label="画像を挿入" disabled={off} onClick={insertImage} />
        <ToolButton
          icon={TableIcon}
          label="表を挿入"
          disabled={off}
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
        <ToolButton icon={Sigma} label="数式を挿入" disabled={off} onClick={onMath} />
        <ToolButton icon={Minus} label="区切り線" disabled={off} onClick={() => chain().setHorizontalRule().run()} />
        <Divider />

        {/* テキスト変換 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={off}>
            <button type="button" className={cn(selectClass, "inline-flex items-center gap-1 px-2 hover:bg-secondary")}>
              <Wand2 className="h-3.5 w-3.5" />
              変換
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="font-mono text-[11px] font-normal text-muted-foreground">対象：{scope}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => transform((t) => t.replace(/[ \t　]/g, ""))}>空白をすべて削除</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => transform((t) => t.replace(/[ \t　]{2,}/g, " "))}>連続する空白を 1 つに</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => transform(toHalfWidth)}>全角の英数字・空白を半角に</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => transform(jpToEnPunctuation)}>「、。」→「, .」</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => transform(enToJpPunctuation)}>「, .」→「、。」</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CaseSensitive className="mr-2 h-4 w-4" />
                大文字・小文字・命名規則
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => transform((t) => t.toUpperCase())}>UPPERCASE</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform((t) => t.toLowerCase())}>lowercase</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => transform(convertCase(toCamelCase))}>camelCase</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform(convertCase(toPascalCase))}>PascalCase</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform(convertCase(toSnakeCase))}>snake_case</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform(convertCase(toKebabCase))}>kebab-case</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Code className="mr-2 h-4 w-4" />
                コメントを削除
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => transform((t) => removeComments(t, "generic_block_line"))}>{"// と /* */"}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform((t) => removeComments(t, "hash_comments"))}>#</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => transform((t) => removeComments(t, "html_comments"))}>{"<!-- -->"}</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-mono text-[11px] font-normal text-muted-foreground">文書全体</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => editor && joinLines(editor)}>改行を削除して 1 段落につなぐ</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor && clearFormatting(editor)}>書式をすべてクリア</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 表示 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(selectClass, "inline-flex items-center gap-1 px-2 hover:bg-secondary")}>
              <Eye className="h-3.5 w-3.5" />
              表示
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuCheckboxItem checked={showNewlines} onCheckedChange={onToggleNewlines}>
              改行マーク（↵ ¶）
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showFullWidthSpaces} onCheckedChange={onToggleFullWidthSpaces}>
              全角スペース
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Divider />
      <ToolButton icon={Search} label="検索と置換 (Ctrl+F)" disabled={off} onClick={onFind} />
      <ToolButton icon={Columns2} label={split ? "分割をやめる (Ctrl+\\)" : "左右に分割 (Ctrl+\\)"} active={split} onClick={onToggleSplit} />
      <ToolButton icon={Keyboard} label="キーボードショートカット" onClick={onShortcuts} />
    </div>
  );
}

/** カーソルが表・コードブロックの中にあるときだけ出る操作バー */
export function ContextBar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      !e || e.isDestroyed ? null : {
        table: e.isActive("table"),
        codeBlock: e.isActive("codeBlock"),
        language: (e.getAttributes("codeBlock").language as string | undefined) ?? "plaintext",
      },
  });
  if (!editor || !state || (!state.table && !state.codeBlock)) return null;
  const chain = () => editor.chain().focus();

  const button = (label: string, onClick: () => void, danger = false) => (
    <button
      key={label}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 font-mono text-[11px] transition-colors hover:bg-secondary",
        danger ? "text-syntax-tag" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {danger && <Trash2 className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 py-1">
      {state.table && (
        <>
          <span className="shrink-0 font-mono text-[11px] text-syntax-keyword">table</span>
          {button("+ 行（上）", () => chain().addRowBefore().run())}
          {button("+ 行（下）", () => chain().addRowAfter().run())}
          {button("+ 列（左）", () => chain().addColumnBefore().run())}
          {button("+ 列（右）", () => chain().addColumnAfter().run())}
          <Divider />
          {button("見出し行の切り替え", () => chain().toggleHeaderRow().run())}
          {button("セルを結合・分割", () => chain().mergeOrSplit().run())}
          <Divider />
          {button("行を削除", () => chain().deleteRow().run(), true)}
          {button("列を削除", () => chain().deleteColumn().run(), true)}
          {button("表を削除", () => chain().deleteTable().run(), true)}
        </>
      )}
      {state.codeBlock && (
        <>
          <span className="shrink-0 font-mono text-[11px] text-syntax-keyword">code</span>
          <select
            aria-label="コードの言語"
            value={state.language}
            onChange={(e) => chain().updateAttributes("codeBlock", { language: e.target.value }).run()}
            className={cn(selectClass, "h-6")}
          >
            {!CODE_LANGUAGES.some(([value]) => value === state.language) && <option value={state.language}>{state.language}</option>}
            {CODE_LANGUAGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {button("コードブロックを解除", () => chain().toggleCodeBlock().run())}
        </>
      )}
    </div>
  );
}
