"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_SIZES = [
  { label: "小", value: "12" },
  { label: "標準", value: "" },
  { label: "大", value: "18" },
  { label: "特大", value: "24" },
];

/**
 * 書式ツールバー。Tiptap v3 は既定ではトランザクションごとに再描画しないため、
 * useEditorState で必要な状態だけを購読する（以前は選択中の書式の表示が更新されていなかった）。
 */
export function MenuBar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();

  const items: { icon: LucideIcon; label: string; active?: boolean; action: () => void }[] = [
    { icon: Bold, label: "太字", active: state.bold, action: () => run((c) => c.toggleBold()) },
    { icon: Italic, label: "斜体", active: state.italic, action: () => run((c) => c.toggleItalic()) },
    { icon: Underline, label: "下線", active: state.underline, action: () => run((c) => c.toggleUnderline()) },
    { icon: Strikethrough, label: "取り消し線", active: state.strike, action: () => run((c) => c.toggleStrike()) },
  ];
  const blocks: typeof items = [
    { icon: List, label: "箇条書き", active: state.bulletList, action: () => run((c) => c.toggleBulletList()) },
    { icon: ListOrdered, label: "番号付きリスト", active: state.orderedList, action: () => run((c) => c.toggleOrderedList()) },
    { icon: Quote, label: "引用", active: state.blockquote, action: () => run((c) => c.toggleBlockquote()) },
    { icon: SquareCode, label: "コードブロック", active: state.codeBlock, action: () => run((c) => c.toggleCodeBlock()) },
    { icon: Minus, label: "区切り線", action: () => run((c) => c.setHorizontalRule()) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/50 px-1.5 py-1" role="toolbar" aria-label="書式">
      {items.map((item) => (
        <IconButton key={item.label} {...item} />
      ))}
      <Divider />
      <select
        aria-label="文字サイズ"
        value={state.fontSize}
        onChange={(e) => (e.target.value ? run((c) => c.setFontSize(e.target.value)) : run((c) => c.unsetFontSize()))}
        className="h-7 rounded-md border border-border bg-card px-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {FONT_SIZES.map((size) => (
          <option key={size.label} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>
      <Divider />
      {blocks.map((item) => (
        <IconButton key={item.label} {...item} />
      ))}
      <div className="flex-1" />
      <IconButton icon={Undo2} label="元に戻す" disabled={!state.canUndo} action={() => run((c) => c.undo())} />
      <IconButton icon={Redo2} label="やり直す" disabled={!state.canRedo} action={() => run((c) => c.redo())} />
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  active,
  disabled,
  action,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  action: () => void;
}) {
  return (
    <button
      type="button"
      onClick={action}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30",
        active ? "bg-syntax-type/15 text-syntax-type" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />;
