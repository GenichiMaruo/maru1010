"use client";

import { useMemo, useState } from "react";
import katex from "katex";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface MathDraft {
  kind: "inline" | "block";
  latex: string;
  /** 既存の数式を編集するときの位置。新規のときは undefined */
  pos?: number;
}

const button =
  "inline-flex h-8 items-center justify-center rounded-md px-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40";

/** 数式（LaTeX）の入力。プレビューを見ながら書ける */
export function MathDialog({
  draft,
  onClose,
  onSubmit,
  onDelete,
}: {
  draft: MathDraft;
  onClose: () => void;
  onSubmit: (draft: MathDraft) => void;
  onDelete?: () => void;
}) {
  const [latex, setLatex] = useState(draft.latex);
  const [kind, setKind] = useState(draft.kind);
  const editing = draft.pos !== undefined;

  const preview = useMemo(() => {
    try {
      return { html: katex.renderToString(latex || "\\;", { displayMode: kind === "block", throwOnError: true }), error: "" };
    } catch (e) {
      return { html: "", error: e instanceof Error ? e.message.replace(/^KaTeX parse error: /, "") : "式を解釈できません" };
    }
  }, [latex, kind]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{editing ? "数式を編集" : "数式を挿入"}</DialogTitle>
          <DialogDescription>LaTeX で入力します。例：<code className="font-mono">{"\\frac{a}{b}"}</code></DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (latex.trim()) onSubmit({ ...draft, kind, latex: latex.trim() });
          }}
        >
          {!editing && (
            <div className="inline-flex rounded-md border border-border p-0.5 font-mono text-xs" role="radiogroup" aria-label="数式の種類">
              {(
                [
                  ["inline", "文中"],
                  ["block", "独立した行"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={kind === value}
                  onClick={() => setKind(value)}
                  className={cn("rounded px-3 py-1.5", kind === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <textarea
            autoFocus
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            rows={3}
            spellCheck={false}
            aria-label="LaTeX"
            placeholder="E = mc^2"
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:border-ring"
          />
          <div className="flex min-h-16 items-center justify-center overflow-x-auto rounded-md border border-border bg-secondary/40 px-3 py-3" aria-live="polite">
            {preview.error ? (
              <p className="font-mono text-xs text-syntax-tag">{preview.error}</p>
            ) : (
              // KaTeX が生成した HTML（入力はエスケープ済み）
              <span dangerouslySetInnerHTML={{ __html: preview.html }} />
            )}
          </div>
          <div className="flex justify-between gap-2">
            <div>
              {editing && onDelete && (
                <button type="button" onClick={onDelete} className={cn(button, "border border-syntax-tag/40 text-syntax-tag hover:bg-syntax-tag/10")}>
                  削除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className={cn(button, "border border-border hover:bg-secondary")}>
                キャンセル
              </button>
              <button type="submit" disabled={!latex.trim() || !!preview.error} className={cn(button, "bg-foreground text-background hover:opacity-90")}>
                {editing ? "更新" : "挿入"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SHORTCUTS: { title: string; items: [string[], string][] }[] = [
  {
    title: "ツール",
    items: [
      [["Ctrl", "F"], "検索と置換"],
      [["Enter"], "次の一致へ（検索中）"],
      [["Shift", "Enter"], "前の一致へ（検索中）"],
      [["Ctrl", "\\"], "左右に分割 / 分割をやめる"],
      [["Ctrl", "S"], "今すぐ保存（普段は自動保存）"],
      [["Esc"], "検索を閉じる"],
    ],
  },
  {
    title: "文字の書式",
    items: [
      [["Ctrl", "B"], "太字"],
      [["Ctrl", "I"], "斜体"],
      [["Ctrl", "U"], "下線"],
      [["Ctrl", "Shift", "S"], "取り消し線"],
      [["Ctrl", "E"], "インラインコード"],
    ],
  },
  {
    title: "段落",
    items: [
      [["Ctrl", "Alt", "1〜3"], "見出し 1〜3"],
      [["Ctrl", "Alt", "0"], "本文に戻す"],
      [["Ctrl", "Shift", "8"], "箇条書き"],
      [["Ctrl", "Shift", "7"], "番号付きリスト"],
      [["Ctrl", "Shift", "9"], "チェックリスト"],
      [["Ctrl", "Shift", "B"], "引用"],
      [["Ctrl", "Alt", "C"], "コードブロック"],
      [["Tab"], "リストの字下げ / 表の次のセル / タブ文字"],
      [["Shift", "Enter"], "段落を変えずに改行"],
    ],
  },
  {
    title: "入力しながら変換（行頭で）",
    items: [
      [["#", "Space"], "見出し（## ### も可）"],
      [["-", "Space"], "箇条書き"],
      [["1.", "Space"], "番号付きリスト"],
      [["[ ]", "Space"], "チェックリスト"],
      [[">", "Space"], "引用"],
      [["```"], "コードブロック"],
      [["$x$"], "数式（文中）"],
    ],
  },
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">キーボードショートカット</DialogTitle>
          <DialogDescription>Mac では Ctrl の代わりに ⌘ を使います。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {SHORTCUTS.map(({ title, items }) => (
            <section key={title}>
              <h3 className="mb-2 font-mono text-[11px] text-syntax-keyword">{title}</h3>
              <ul className="space-y-1.5">
                {items.map(([keys, label]) => (
                  <li key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="flex shrink-0 gap-1">
                      {keys.map((k) => (
                        <kbd key={k} className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
