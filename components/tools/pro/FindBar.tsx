"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { closeSearch, getSearchState, replaceAll, replaceCurrent, setSearchQuery, stepSearch } from "./search";

const inputClass =
  "h-7 min-w-0 flex-1 rounded-md border border-border bg-card px-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring";

/** 検索と置換。Enter で次へ、Shift+Enter で前へ、Esc で閉じる */
export function FindBar({
  editor,
  initialText,
  focusToken,
  onClose,
  onNotify,
}: {
  editor: Editor;
  /** 開いたときに選択していた文字列 */
  initialText: string;
  /** Ctrl+F を押し直すたびに変わる値。検索欄へフォーカスを戻す */
  focusToken: number;
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (e.isDestroyed) return { count: 0, index: -1, invalid: false };
      const s = getSearchState(e);
      return { count: s.matches.length, index: s.index, invalid: s.invalid };
    },
  });

  useEffect(() => {
    setSearchQuery(editor, { text, caseSensitive, regex });
  }, [editor, text, caseSensitive, regex]);

  // 閉じる・別のファイルに切り替えるときにハイライトを消す
  useEffect(() => () => closeSearch(editor), [editor]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusToken]);

  const close = () => {
    onClose();
    // 一致箇所を選択した状態で本文に戻る
    requestAnimationFrame(() => !editor.isDestroyed && editor.commands.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      stepSearch(editor, e.shiftKey ? -1 : 1);
    }
  };

  const toggle = (label: string, title: string, on: boolean, set: (v: boolean) => void) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={on}
      onClick={() => set(!on)}
      className={cn(
        "h-7 w-7 shrink-0 rounded-md font-mono text-xs transition-colors",
        on ? "bg-syntax-type/15 text-syntax-type" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  const action = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={search.count === 0}
      className="h-7 shrink-0 rounded-md border border-border bg-card px-2 font-mono text-xs text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
    >
      {label}
    </button>
  );

  return (
    <div className="shrink-0 space-y-1 border-b border-border bg-background px-2 py-1.5" role="search" onKeyDown={onKeyDown}>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="検索"
          aria-label="検索する文字列"
          className={cn(inputClass, search.invalid && "border-syntax-tag")}
        />
        {toggle("Aa", "大文字と小文字を区別", caseSensitive, setCaseSensitive)}
        {toggle(".*", "正規表現", regex, setRegex)}
        <span className="w-16 shrink-0 text-center font-mono text-[11px] text-muted-foreground tabular-nums" aria-live="polite">
          {search.invalid ? "不正な式" : !text ? "" : search.count === 0 ? "0 件" : `${search.index + 1} / ${search.count}`}
        </span>
        <button
          type="button"
          title="前へ (Shift+Enter)"
          aria-label="前の一致へ"
          disabled={search.count === 0}
          onClick={() => stepSearch(editor, -1)}
          className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <ChevronUp className="mx-auto h-4 w-4" />
        </button>
        <button
          type="button"
          title="次へ (Enter)"
          aria-label="次の一致へ"
          disabled={search.count === 0}
          onClick={() => stepSearch(editor, 1)}
          className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <ChevronDown className="mx-auto h-4 w-4" />
        </button>
        <button
          type="button"
          title="閉じる (Esc)"
          aria-label="検索を閉じる"
          onClick={close}
          className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="mx-auto h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <input
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="置換後の文字列"
          aria-label="置換後の文字列"
          className={inputClass}
        />
        {action("置換", () => replaceCurrent(editor, replacement))}
        {action("すべて置換", () => onNotify(`${replaceAll(editor, replacement)} 件を置換しました`))}
      </div>
    </div>
  );
}
