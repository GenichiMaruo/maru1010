"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { Plus, X } from "lucide-react";
import { setVisualCues } from "@/components/tools/charcount/visualCues";
import { cn } from "@/lib/utils";
import { createExtensions } from "./extensions";
import type { ProFile } from "./store";

const CONTENT_DELAY_MS = 250;

export const editorText = (editor: Editor) => editor.getText({ blockSeparator: "\n" });
const countChars = (editor: Editor) => Array.from(editorText(editor).replace(/\n/g, "")).length;

/**
 * 1 つのペイン。上にファイルのタブ、下にエディタ。
 * エディタはファイルごとに作り直す（親が key にファイル ID を渡す）ので、
 * 「元に戻す」が別のファイルの内容にまたがることはない。
 */
export function EditorPane({
  file,
  files,
  otherPaneFileId,
  active,
  showNewlines,
  showFullWidthSpaces,
  autoFocus,
  onFocus,
  onEditor,
  onContent,
  onOpen,
  onNewFile,
  onClose,
}: {
  file: ProFile;
  files: ProFile[];
  otherPaneFileId: string | null;
  active: boolean;
  showNewlines: boolean;
  showFullWidthSpaces: boolean;
  /** 作成直後などに、カーソルを入れる */
  autoFocus?: boolean;
  onFocus: () => void;
  onEditor: (editor: Editor | null) => void;
  onContent: (id: string, content: string, chars: number) => void;
  onOpen: (id: string) => void;
  onNewFile: () => void;
  /** 分割を閉じる（分割中だけ渡す） */
  onClose?: () => void;
}) {
  const timerRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef(false);
  // 最新のコールバックを参照する（エディタは作り直さない）
  const callbacks = useRef({ onFocus, onContent, onEditor });
  useEffect(() => {
    callbacks.current = { onFocus, onContent, onEditor };
  });

  const fileId = file.id;
  const editorRef = useRef<Editor | null>(null);
  function flush(e: Editor) {
    window.clearTimeout(timerRef.current);
    if (!pendingRef.current) return;
    pendingRef.current = false;
    callbacks.current.onContent(fileId, e.getHTML(), countChars(e));
  }

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    extensions: createExtensions(),
    content: file.content || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor pro-editor",
        spellcheck: "false",
        "aria-label": `${file.name} の本文`,
      },
    },
    onFocus: () => callbacks.current.onFocus(),
    onUpdate: ({ editor: e }) => {
      // 入力のたびに HTML 化しないよう、少し待ってからまとめて反映する
      pendingRef.current = true;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => flush(e), CONTENT_DELAY_MS);
    },
    // ファイルの切り替え・画面を離れるときに、未反映の変更を必ず書き出す
    onDestroy: () => editorRef.current && flush(editorRef.current),
  });

  useEffect(() => {
    editorRef.current = editor;
    callbacks.current.onEditor(editor);
    if (!editor) return;
    const onBlur = () => flush(editor);
    editor.on("blur", onBlur);
    return () => {
      editor.off("blur", onBlur);
      callbacks.current.onEditor(null);
    };
    // flush は editor と fileId だけに依存する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (editor) setVisualCues(editor, { newlines: showNewlines, fullWidthSpaces: showFullWidthSpaces });
  }, [editor, showNewlines, showFullWidthSpaces]);

  return (
    <section
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-card", !active && "opacity-[0.92]")}
      onPointerDownCapture={onFocus}
      aria-label={`${file.name} のエディタ`}
    >
      {/* タブ */}
      <div className="flex h-9 shrink-0 items-stretch border-b border-border bg-secondary/50">
        <div className="no-scrollbar flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
          {files.map((f) => {
            const current = f.id === file.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={current}
                onClick={() => !current && onOpen(f.id)}
                title={f.id === otherPaneFileId ? `${f.name}（もう一方のペインと入れ替え）` : f.name}
                className={cn(
                  "relative flex max-w-44 shrink-0 items-center gap-1.5 border-r border-border px-3 font-mono text-xs transition-colors",
                  current ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                  f.id === otherPaneFileId && "italic opacity-60"
                )}
              >
                {current && (
                  <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-0.5", active ? "bg-syntax-string" : "bg-border")} />
                )}
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onNewFile}
            title="新しい文書"
            aria-label="新しい文書"
            className="flex w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="このペインを閉じる"
            aria-label="このペインを閉じる"
            className="flex w-9 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 本文。余白をクリックしても末尾にカーソルが入る */}
      <div
        className="min-h-0 flex-1 cursor-text overflow-y-auto overscroll-contain"
        onClick={(e) => {
          if (e.target === e.currentTarget) editor?.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} className="mx-auto min-h-full w-full max-w-3xl" />
      </div>
    </section>
  );
}
