"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import runes from "runes2";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { FontSizeExtension } from "@/components/tools/extensions";
import { ToolShell } from "@/components/tools/shared/ToolShell";
import { ToolButton } from "@/components/tools/shared/ToolButton";
import { useStoredState } from "@/hooks/useStoredState";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
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
import { MenuBar } from "./charcount/MenuBar";
import { VisualCues, setVisualCues } from "./charcount/visualCues";
import { clearFormatting, getLines, joinLines, replaceWithLines, transformTextNodes } from "./charcount/commands";

// 以前のバージョンと同じキーを使い、保存済みの本文・設定を引き継ぐ
const CONTENT_KEY = "characterCountApp_tiptap_v2";
const SETTINGS_KEY = "characterCountApp_settings_v2";
const DEFAULT_SETTINGS = { showNewlineMarkers: false, showFullWidthSpaceHighlight: false };

const COMMENT_STYLES = [
  { value: "generic_block_line", label: "// と /* */" },
  { value: "hash_comments", label: "#" },
  { value: "html_comments", label: "<!-- -->" },
];

const CASES = [
  { label: "camelCase", fn: toCamelCase },
  { label: "PascalCase", fn: toPascalCase },
  { label: "snake_case", fn: toSnakeCase },
  { label: "kebab-case", fn: toKebabCase },
];

type Section = "view" | "format" | "code";

function readStoredContent() {
  try {
    return localStorage.getItem(CONTENT_KEY) ?? "";
  } catch {
    return "";
  }
}

function countText(text: string) {
  const trimmed = text.trim();
  return {
    // 書記素（見た目の 1 文字）単位。絵文字や結合文字も 1 文字と数える
    chars: runes(text.replace(/\n/g, "")).length,
    noSpaces: runes(text.replace(/[\s　]/g, "")).length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text.split("\n").filter((line) => line.trim()).length,
  };
}

export default function CharacterCountTab() {
  const [settings, setSettings] = useStoredState(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [section, setSection] = useState<Section>("view");
  const [commentStyle, setCommentStyle] = useState(COMMENT_STYLES[0].value);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  /** 数字をコピーした統計の名前（少しの間だけ表示を変える） */
  const [copiedStat, setCopiedStat] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const flashTimeoutRef = useRef<number | undefined>(undefined);
  const statTimeoutRef = useRef<number | undefined>(undefined);

  const editor = useEditor({
    // SSR では描画せず、クライアントで保存済みの本文から始める
    immediatelyRender: false,
    extensions: [StarterKit, TextStyle, FontSizeExtension.configure({ requireSelection: false }), VisualCues],
    content: typeof window === "undefined" ? "" : readStoredContent(),
    editorProps: {
      attributes: {
        class: "charcount-editor min-h-60 px-4 py-3 text-foreground outline-none",
        "aria-label": "本文",
      },
    },
    onUpdate: ({ editor: e }) => {
      // 入力のたびに書き込まないよう、少し待ってから保存する
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(CONTENT_KEY, e.getHTML());
        } catch {}
      }, 300);
    },
  });

  const { text, focused } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      text: e?.getText({ blockSeparator: "\n" }) ?? "",
      focused: e?.isFocused ?? false,
    }),
  }) ?? { text: "", focused: false };

  // 表示設定をエディタに反映する（エディタは作り直さない）
  useEffect(() => {
    if (editor) {
      setVisualCues(editor, {
        newlines: settings.showNewlineMarkers,
        fullWidthSpaces: settings.showFullWidthSpaceHighlight,
      });
    }
  }, [editor, settings.showNewlineMarkers, settings.showFullWidthSpaceHighlight]);

  useEffect(
    () => () => {
      window.clearTimeout(saveTimeoutRef.current);
      window.clearTimeout(flashTimeoutRef.current);
      window.clearTimeout(statTimeoutRef.current);
    },
    []
  );

  const copyStat = async (label: string, value: number) => {
    if (!(await copyText(String(value)))) return;
    setCopiedStat(label);
    window.clearTimeout(statTimeoutRef.current);
    statTimeoutRef.current = window.setTimeout(() => setCopiedStat(null), 1500);
  };

  const stats = countText(text);
  const empty = stats.chars === 0;

  const flash = (set: (v: boolean) => void) => {
    set(true);
    window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      setConfirmClear(false);
    }, 2500);
  };

  const handleCopy = async () => {
    if (editor && (await copyText(editor.getText({ blockSeparator: "\n" })))) flash(setCopied);
  };

  const handleClear = () => {
    if (!editor) return;
    if (!confirmClear) return flash(setConfirmClear);
    editor.chain().clearContent(true).focus().run();
    setConfirmClear(false);
  };

  // コード向けの変換は段落をまたぐことがあるので（複数行の /* */ など）、全文をまとめて処理する
  const handleRemoveComments = () => {
    if (!editor) return;
    const result = removeComments(getLines(editor).join("\n"), commentStyle);
    replaceWithLines(editor, result.split("\n").map((line) => line.replace(/[ \t]+$/, "")));
  };

  const handleCase = (fn: (words: string[]) => string) => {
    if (!editor) return;
    replaceWithLines(
      editor,
      getLines(editor).map((line) => {
        const words = toWords(line);
        return words.length ? fn(words) : line;
      })
    );
  };

  const toggles = [
    { key: "showNewlineMarkers", label: "改行マーク", sample: "↵ ¶" },
    { key: "showFullWidthSpaceHighlight", label: "全角スペース", sample: "□" },
  ] as const;

  const formatActions = [
    { label: "改行を削除してつなぐ", run: () => editor && joinLines(editor) },
    { label: "空白をすべて削除", run: () => editor && transformTextNodes(editor, (t) => t.replace(/[ \t　]/g, "")) },
    { label: "連続する空白を 1 つに", run: () => editor && transformTextNodes(editor, (t) => t.replace(/[ \t　]{2,}/g, " ")) },
    { label: "書式をクリア", run: () => editor && clearFormatting(editor) },
    { label: "「、。」→「, .」", run: () => editor && transformTextNodes(editor, jpToEnPunctuation) },
    { label: "「, .」→「、。」", run: () => editor && transformTextNodes(editor, enToJpPunctuation) },
  ];

  return (
    <ToolShell
      wide
      file="charcount.ts"
      mode={focused ? "insert" : "normal"}
      tone={focused ? "run" : "idle"}
      info={
        <>
          <span>{stats.chars.toLocaleString()} chars</span>
          <span>{stats.lines} lines</span>
          {/* 400 字詰め原稿用紙に換算した枚数（目安） */}
          <span className="hidden sm:inline">原稿用紙 {Math.ceil(stats.chars / 400)} 枚</span>
        </>
      }
      actions={
        <Link
          href="/tools/char-count-pro"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          pro <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      }
      bodyClassName="px-4 py-5 sm:px-6"
    >
      <div className="overflow-hidden rounded-md border border-border bg-background/60 focus-within:border-ring">
        {editor && <MenuBar editor={editor} />}
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      {/* クリックで数字をコピー（桁区切りなしの数字だけ。フォームなどにそのまま貼れるように） */}
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "文字数", value: stats.chars, color: "text-syntax-type" },
          { label: "空白を除く", value: stats.noSpaces, color: "text-syntax-keyword" },
          { label: "単語", value: stats.words, color: "text-syntax-string" },
          { label: "行", value: stats.lines, color: "text-syntax-number" },
        ].map(({ label, value, color }) => {
          const done = copiedStat === label;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => copyStat(label, value)}
                title={`${label}をコピー`}
                aria-label={`${label} ${value.toLocaleString()}（クリックでコピー）`}
                className={cn(
                  "group w-full rounded-md border bg-background/60 px-3 py-2 text-left transition-colors hover:border-foreground/30 hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]",
                  done ? "border-syntax-string" : "border-border"
                )}
              >
                <span className="flex items-center justify-between gap-1 font-mono text-[11px] text-muted-foreground">
                  <span className={cn(done && "text-syntax-string")}>{done ? "コピーしました" : label}</span>
                  {done ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5 text-syntax-string" />
                  ) : (
                    <Copy aria-hidden="true" className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" />
                  )}
                </span>
                <span className={cn("block font-mono text-2xl font-medium tabular-nums", color)}>{value.toLocaleString()}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {copiedStat ? `${copiedStat}をコピーしました` : ""}
      </p>

      <div className="mt-6">
        <div className="inline-flex rounded-md border border-border p-0.5 font-mono text-xs" role="tablist" aria-label="ツール">
          {(
            [
              ["view", "表示"],
              ["format", "整形"],
              ["code", "コード"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={section === value}
              onClick={() => setSection(value)}
              className={cn(
                "rounded px-3 py-1.5 transition-colors",
                section === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3" role="tabpanel">
          {section === "view" && (
            <div className="flex flex-wrap gap-2">
              {toggles.map(({ key, label, sample }) => (
                <ToolButton
                  key={key}
                  size="sm"
                  variant={settings[key] ? "primary" : "outline"}
                  aria-pressed={settings[key]}
                  onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                >
                  <span className="opacity-60">{sample}</span>
                  {label}を表示
                </ToolButton>
              ))}
            </div>
          )}

          {section === "format" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {formatActions.map(({ label, run }) => (
                <ToolButton key={label} size="sm" onClick={run} disabled={empty}>
                  {label}
                </ToolButton>
              ))}
            </div>
          )}

          {section === "code" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="コメントの書き方"
                  value={commentStyle}
                  onChange={(e) => setCommentStyle(e.target.value)}
                  className="h-8 rounded-md border border-border bg-card px-2 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {COMMENT_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <ToolButton size="sm" onClick={handleRemoveComments} disabled={empty}>
                  コメントを削除
                </ToolButton>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CASES.map(({ label, fn }) => (
                  <ToolButton key={label} size="sm" onClick={() => handleCase(fn)} disabled={empty}>
                    {label}
                  </ToolButton>
                ))}
              </div>
              <p className="font-mono text-[11px] text-syntax-comment">{"// コード向けの変換は 1 行ずつ処理し、書式は外れます"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <ToolButton onClick={handleCopy} disabled={empty} icon={copied ? <Check /> : <Copy />}>
          {copied ? "コピーしました" : "テキストをコピー"}
        </ToolButton>
        <ToolButton variant="danger" onClick={handleClear} disabled={empty} icon={<Trash2 />}>
          {confirmClear ? "もう一度押すとクリア" : "クリア"}
        </ToolButton>
      </div>
    </ToolShell>
  );
}
