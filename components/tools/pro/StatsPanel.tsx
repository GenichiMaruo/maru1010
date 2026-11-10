"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { analyzeText, countCharKinds } from "@/utils/statsUtils";
import { cn } from "@/lib/utils";
import { editorText } from "./EditorPane";

const KINDS = [
  { key: "hiragana", label: "ひらがな", color: "bg-syntax-type" },
  { key: "katakana", label: "カタカナ", color: "bg-syntax-fn" },
  { key: "kanji", label: "漢字", color: "bg-syntax-keyword" },
  { key: "alnum", label: "英数字", color: "bg-syntax-number" },
  { key: "other", label: "その他", color: "bg-muted-foreground/50" },
] as const;

/** エディタの本文と選択範囲のテキストを購読する */
export function useEditorText(editor: Editor | null) {
  return (
    useEditorState({
      editor,
      selector: ({ editor: e }) => {
        if (!e || e.isDestroyed) return null;
        const { from, to, empty } = e.state.selection;
        return {
          text: editorText(e),
          selected: empty ? "" : e.state.doc.textBetween(from, to, "\n"),
          focused: e.isFocused,
        };
      },
    }) ?? { text: "", selected: "", focused: false }
  );
}

/** コピーした項目の名前を少しの間だけ覚えておく */
function useCopyFeedback() {
  const [copied, setCopied] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  const copy = async (label: string, value: string) => {
    if (!(await copyText(value))) return;
    setCopied(label);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(null), 1500);
  };
  return { copied, copy };
}

const CopiedLabel = () => (
  <span className="flex items-center gap-1 text-syntax-string">
    <Check aria-hidden="true" className="h-3 w-3" />
    コピーしました
  </span>
);

const CopyHint = () => (
  <Copy aria-hidden="true" className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" />
);

/** 統計。文字を選択しているあいだは、選択範囲の統計に切り替わる。数字はクリックでコピーできる */
export function StatsPanel({
  editor,
  target,
  onTargetChange,
}: {
  editor: Editor | null;
  target: number;
  onTargetChange: (target: number) => void;
}) {
  const { text, selected } = useEditorText(editor);
  const { copied, copy } = useCopyFeedback();

  /** クリックで数字（桁区切りなし）をコピーするボタンの属性 */
  const copyProps = (label: string, value: number) => ({
    onClick: () => copy(label, String(value)),
    // エディタのフォーカスと選択範囲を外さない（選択範囲の数字をそのままコピーできるように）
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    title: `${label}をコピー`,
    "aria-label": `${label} ${value.toLocaleString()}（クリックでコピー）`,
  });
  const whole = analyzeText(text);
  const scoped = selected ? analyzeText(selected) : whole;
  const kinds = countCharKinds(selected || text);
  const kindTotal = Object.values(kinds).reduce((a, b) => a + b, 0);

  const ratio = target > 0 ? whole.chars / target : 0;
  const over = target > 0 && whole.chars > target;

  // [表示名, 表示する値, コピーする数字]
  const rows: [string, string, number][] = [
    ["空白を除く", scoped.charsNoSpaces.toLocaleString(), scoped.charsNoSpaces],
    ["単語", scoped.words.toLocaleString(), scoped.words],
    ["行", scoped.lines.toLocaleString(), scoped.lines],
    ["文", scoped.sentences.toLocaleString(), scoped.sentences],
    ["原稿用紙", `${scoped.manuscriptPages} 枚`, scoped.manuscriptPages],
    ["バイト (UTF-8)", scoped.bytes.toLocaleString(), scoped.bytes],
    ["読了の目安", `約 ${scoped.readingMinutes} 分`, scoped.readingMinutes],
  ];
  const charsLabel = selected ? "選択範囲の文字数" : "文字数";

  return (
    <div className="space-y-4 px-3 py-3">
      <button
        type="button"
        {...copyProps(charsLabel, scoped.chars)}
        className="group -mx-1.5 block w-[calc(100%+0.75rem)] rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline justify-between font-mono text-[11px] text-muted-foreground">
          {copied === charsLabel ? <CopiedLabel /> : <span>{charsLabel}</span>}
          {selected ? (
            <span className="rounded bg-syntax-type/15 px-1.5 text-syntax-type">selection</span>
          ) : (
            <CopyHint />
          )}
        </span>
        <span className="block font-mono text-4xl font-medium tracking-tight text-foreground tabular-nums">
          {scoped.chars.toLocaleString()}
          {selected && <span className="ml-2 text-sm text-muted-foreground">/ {whole.chars.toLocaleString()}</span>}
        </span>
      </button>

      {/* 目標文字数（文書ごと） */}
      <div>
        <label className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
          <span>目標</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={target || ""}
              placeholder="なし"
              onChange={(e) => onTargetChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className="h-6 w-20 rounded border border-border bg-card px-1.5 text-right font-mono text-xs text-foreground outline-none focus-visible:border-ring"
            />
            字
          </span>
        </label>
        {target > 0 && (
          <>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={Math.min(whole.chars, target)}
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-200", over ? "bg-syntax-tag" : ratio >= 0.9 ? "bg-syntax-string" : "bg-syntax-type")}
                style={{ width: `${Math.min(1, ratio) * 100}%` }}
              />
            </div>
            <p className={cn("mt-1 font-mono text-[11px]", over ? "text-syntax-tag" : "text-muted-foreground")}>
              {Math.round(ratio * 100)}%・
              {over ? `${(whole.chars - target).toLocaleString()} 字オーバー` : `あと ${(target - whole.chars).toLocaleString()} 字`}
            </p>
          </>
        )}
      </div>

      <ul className="-mx-1.5 font-mono text-xs">
        {rows.map(([label, value, raw]) => (
          <li key={label}>
            <button
              type="button"
              {...copyProps(label, raw)}
              className="group flex w-full items-center justify-between gap-3 rounded px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-ring"
            >
              {copied === label ? <CopiedLabel /> : <span className="text-muted-foreground">{label}</span>}
              <span className="flex items-center gap-1.5 text-foreground tabular-nums">
                <CopyHint />
                {value}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {copied ? `${copied}をコピーしました` : ""}
      </p>

      {/* 文字種の内訳 */}
      {kindTotal > 0 && (
        <div>
          <div className="flex h-1.5 gap-px overflow-hidden rounded-full" aria-hidden="true">
            {KINDS.map(({ key, color }) => kinds[key] > 0 && <span key={key} className={color} style={{ width: `${(kinds[key] / kindTotal) * 100}%` }} />)}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
            {KINDS.map(({ key, label, color }) => (
              <li key={key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color)} />
                <span className="flex-1 truncate">{label}</span>
                <span className="text-foreground tabular-nums">{Math.round((kinds[key] / kindTotal) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
