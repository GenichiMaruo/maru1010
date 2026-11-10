"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/core";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import LinkModal from "@/components/tools/LinkModal";
import LaTeXExportModal from "@/components/tools/LaTeXExportModal";
import { useLinkModal } from "@/hooks/useLinkModal";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { downloadLaTeXFile, generateLaTeXDocument } from "@/utils/latexExport";
import { MathDialog, ShortcutsDialog, type MathDraft } from "./Dialogs";
import { EditorPane, editorText } from "./EditorPane";
import { MATH_EDIT_EVENT, type MathEditDetail } from "./extensions";
import { FindBar } from "./FindBar";
import { download, readImportFile, toMarkdown, wrapHtml } from "./io";
import { Sidebar, type ExportKind } from "./Sidebar";
import { useEditorText } from "./StatsPanel";
import { createFile, useWorkspace, type ProFile } from "./store";
import { ContextBar, Toolbar } from "./Toolbar";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

const DESKTOP_QUERY = "(min-width: 768px)";
const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

/** 広い画面（サイドバーを横に並べる）かどうか。画面の回転やウィンドウの幅の変更に追従する */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    isDesktop,
    () => true
  );
}

export default function ProWorkspace() {
  const { ws, dispatch, status, flush } = useWorkspace();
  const desktop = useIsDesktop();
  const [editors, setEditors] = useState<[Editor | null, Editor | null]>([null, null]);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [find, setFind] = useState<{ token: number; text: string } | null>(null);
  const [math, setMath] = useState<MathDraft | null>(null);
  const [shortcuts, setShortcuts] = useState(false);
  const [latex, setLatex] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dragging, setDragging] = useState(false);
  // 新しく作った・読み込んだ文書には、開いたときにカーソルを入れる
  const [focusId, setFocusId] = useState<string | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const splitRef = useRef<HTMLDivElement>(null);

  const activeEditor = editors[ws.activePane];
  const activeFile = ws.files.find((f) => f.id === ws.panes[ws.activePane]) ?? ws.files[0];
  const split = ws.panes[1] !== null;
  const link = useLinkModal(activeEditor);
  const { text, selected, focused } = useEditorText(activeEditor);

  // ページ全体はスクロールさせない（スクロールは各ペインの中だけ）
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const notify = useCallback((message: string, action?: Toast["action"]) => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, action });
    toastTimerRef.current = window.setTimeout(() => setToast(null), action ? 8000 : 3500);
  }, []);

  const setEditor = useCallback(
    (pane: 0 | 1) => (editor: Editor | null) =>
      setEditors((prev) => {
        if (prev[pane] === editor) return prev;
        const next: [Editor | null, Editor | null] = [...prev];
        next[pane] = editor;
        return next;
      }),
    []
  );
  // ペインごとに同じ関数を渡し続ける（毎回新しい関数だとエディタの登録が繰り返される）
  const setEditorLeft = useMemo(() => setEditor(0), [setEditor]);
  const setEditorRight = useMemo(() => setEditor(1), [setEditor]);

  const onContent = useCallback(
    (id: string, content: string, chars: number) => dispatch({ type: "content", id, content, chars }),
    [dispatch]
  );

  // ---- 文書の操作 ----

  const uniqueName = (base: string) => {
    const names = new Set(ws.files.map((f) => f.name));
    if (!names.has(base)) return base;
    for (let i = 2; ; i++) if (!names.has(`${base} ${i}`)) return `${base} ${i}`;
  };

  const addAndOpen = (files: ProFile[]) => {
    dispatch({ type: "addFiles", files, open: true });
    setFocusId(files[0]?.id ?? null);
  };

  const newFile = () => addAndOpen([createFile(uniqueName("無題"))]);

  const duplicate = (id: string) => {
    const file = ws.files.find((f) => f.id === id);
    if (!file) return;
    // 開いている文書は、まだ反映されていない入力も含めて複製する
    const pane = ws.panes.indexOf(id);
    const editor = pane === -1 ? null : editors[pane];
    const copy = createFile(uniqueName(`${file.name} のコピー`), editor ? editor.getHTML() : file.content, file.chars);
    addAndOpen([{ ...copy, target: file.target }]);
  };

  const remove = (id: string) => {
    const index = ws.files.findIndex((f) => f.id === id);
    const file = ws.files[index];
    if (!file) return;
    const pane = ws.panes.indexOf(id);
    const editor = pane === -1 ? null : editors[pane];
    const snapshot: ProFile = editor ? { ...file, content: editor.getHTML() } : file;
    dispatch({ type: "deleteFile", id });
    notify(`「${file.name}」を削除しました`, {
      label: "元に戻す",
      run: () => {
        dispatch({ type: "restoreFile", file: snapshot, index });
        setFocusId(snapshot.id);
      },
    });
  };

  const importFiles = async (list: FileList | File[]) => {
    const imported: ProFile[] = [];
    for (const file of Array.from(list)) {
      try {
        for (const { name, content } of await readImportFile(file)) {
          const el = document.createElement("div");
          el.innerHTML = content;
          imported.push(createFile(name, content, Array.from((el.textContent ?? "").replace(/\n/g, "")).length));
        }
      } catch {
        notify(`「${file.name}」を読み込めませんでした`);
      }
    }
    if (imported.length === 0) return;
    addAndOpen(imported);
    notify(imported.length === 1 ? `「${imported[0].name}」を新しい文書として読み込みました` : `${imported.length} 件の文書を読み込みました`);
  };

  const exportAs = async (kind: ExportKind) => {
    if (kind === "backup") {
      flush();
      const files = ws.files.map((f) => {
        const pane = ws.panes.indexOf(f.id);
        const editor = pane === -1 ? null : editors[pane];
        return { name: f.name, content: editor ? editor.getHTML() : f.content, target: f.target, updatedAt: f.updatedAt };
      });
      const date = new Date().toISOString().slice(0, 10);
      download(`char-count-pro-backup-${date}.json`, JSON.stringify({ app: "char-count-pro", version: 3, files }, null, 2), "application/json");
      return;
    }
    if (!activeEditor) return;
    const name = activeFile.name;
    if (kind === "copy") notify((await copyText(editorText(activeEditor))) ? "テキストをコピーしました" : "コピーできませんでした");
    else if (kind === "txt") download(`${name}.txt`, editorText(activeEditor) + "\n", "text/plain");
    else if (kind === "md") download(`${name}.md`, toMarkdown(activeEditor.getJSON()), "text/markdown");
    else if (kind === "html") download(`${name}.html`, wrapHtml(name, activeEditor.getHTML()), "text/html");
    else if (kind === "latex") setLatex(activeEditor.getHTML());
  };

  // ---- 検索・数式・ショートカット ----

  const openFind = useCallback(() => {
    if (!activeEditor) return;
    const { from, to, empty } = activeEditor.state.selection;
    const selection = empty ? "" : activeEditor.state.doc.textBetween(from, to, " ");
    setFind((prev) => ({
      token: (prev?.token ?? 0) + 1,
      // 1 行の選択なら、それを検索語にする
      text: selection && !selection.includes("\n") && selection.length <= 100 ? selection : (prev?.text ?? ""),
    }));
  }, [activeEditor]);

  const toggleSidebar = useCallback(() => {
    if (desktop) dispatch({ type: "set", patch: { sidebarOpen: !ws.sidebarOpen } });
    else setMobileSidebar((v) => !v);
  }, [dispatch, ws.sidebarOpen, desktop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "f" || key === "h") {
        e.preventDefault();
        openFind();
      } else if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.(); // 入力中の内容を反映させる
        activeEditor?.commands.focus();
        flush();
        notify("保存しました（変更は自動で保存されています）");
      } else if (e.key === "\\") {
        e.preventDefault();
        dispatch({ type: "toggleSplit" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openFind, flush, notify, dispatch, activeEditor]);

  useEffect(() => {
    const onMathEdit = (e: Event) => setMath((e as CustomEvent<MathEditDetail>).detail);
    window.addEventListener(MATH_EDIT_EVENT, onMathEdit);
    return () => window.removeEventListener(MATH_EDIT_EVENT, onMathEdit);
  }, []);

  const submitMath = (draft: MathDraft) => {
    if (!activeEditor) return;
    const chain = activeEditor.chain().focus();
    const { latex: value, pos } = draft;
    if (draft.kind === "inline") (pos === undefined ? chain.insertInlineMath({ latex: value }) : chain.updateInlineMath({ latex: value, pos })).run();
    else (pos === undefined ? chain.insertBlockMath({ latex: value }) : chain.updateBlockMath({ latex: value, pos })).run();
    setMath(null);
  };

  const deleteMath = () => {
    if (!activeEditor || !math || math.pos === undefined) return;
    const chain = activeEditor.chain().focus();
    (math.kind === "inline" ? chain.deleteInlineMath({ pos: math.pos }) : chain.deleteBlockMath({ pos: math.pos })).run();
    setMath(null);
  };

  // ---- 分割の境界をドラッグ ----

  const startResize = (e: React.PointerEvent) => {
    const container = splitRef.current;
    if (!container) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const horizontal = desktop;
    const onMove = (ev: PointerEvent) => {
      const ratio = horizontal ? (ev.clientX - rect.left) / rect.width : (ev.clientY - rect.top) / rect.height;
      dispatch({ type: "set", patch: { splitRatio: Math.min(0.8, Math.max(0.2, ratio)) } });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ---- 描画 ----

  const sidebar = (
    <Sidebar
      ws={ws}
      activeFile={activeFile}
      editor={activeEditor}
      onOpen={(id) => {
        dispatch({ type: "open", id });
        setMobileSidebar(false);
      }}
      onNewFile={newFile}
      onRename={(id, name) => dispatch({ type: "patchFile", id, patch: { name } })}
      onDuplicate={duplicate}
      onDelete={remove}
      onMove={(from, to) => dispatch({ type: "moveFile", from, to })}
      onTargetChange={(target) => dispatch({ type: "patchFile", id: activeFile.id, patch: { target } })}
      onImport={importFiles}
      onExport={exportAs}
    />
  );

  const pane = (index: 0 | 1) => {
    const file = ws.files.find((f) => f.id === ws.panes[index]);
    if (!file) return null;
    return (
      <EditorPane
        key={file.id}
        file={file}
        files={ws.files}
        otherPaneFileId={ws.panes[index === 0 ? 1 : 0]}
        active={!split || ws.activePane === index}
        showNewlines={ws.showNewlines}
        showFullWidthSpaces={ws.showFullWidthSpaces}
        autoFocus={file.id === focusId}
        onFocus={() => dispatch({ type: "focusPane", pane: index })}
        onEditor={index === 0 ? setEditorLeft : setEditorRight}
        onContent={onContent}
        onOpen={(id) => dispatch({ type: "open", id, pane: index })}
        onNewFile={newFile}
        onClose={split ? () => dispatch({ type: "closePane", pane: index }) : undefined}
      />
    );
  };

  const chars = Array.from(text.replace(/\n/g, "")).length;
  const selectedChars = Array.from(selected.replace(/\n/g, "")).length;
  const over = activeFile.target > 0 && chars > activeFile.target;

  return (
    <div
      className="fixed inset-0 flex bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(false);
        importFiles(e.dataTransfer.files);
      }}
    >
      {/* サイドバー：広い画面では横に並べ、狭い画面では上に重ねて出す */}
      {desktop && ws.sidebarOpen && sidebar}
      {!desktop && mobileSidebar && (
        <div className="fixed inset-0 z-40 flex">
          {sidebar}
          <button type="button" aria-label="サイドバーを閉じる" className="flex-1 bg-black/40" onClick={() => setMobileSidebar(false)} />
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Toolbar
          editor={activeEditor}
          split={split}
          sidebarOpen={desktop ? ws.sidebarOpen : mobileSidebar}
          showNewlines={ws.showNewlines}
          showFullWidthSpaces={ws.showFullWidthSpaces}
          onToggleSidebar={toggleSidebar}
          onToggleSplit={() => dispatch({ type: "toggleSplit" })}
          onToggleNewlines={() => dispatch({ type: "set", patch: { showNewlines: !ws.showNewlines } })}
          onToggleFullWidthSpaces={() => dispatch({ type: "set", patch: { showFullWidthSpaces: !ws.showFullWidthSpaces } })}
          onLink={link.openLinkModal}
          onMath={() => setMath({ kind: "inline", latex: "" })}
          onFind={openFind}
          onShortcuts={() => setShortcuts(true)}
          onNotify={notify}
        />
        {find && activeEditor && (
          <FindBar
            key={activeFile.id}
            editor={activeEditor}
            initialText={find.text}
            focusToken={find.token}
            onClose={() => setFind(null)}
            onNotify={notify}
          />
        )}
        <ContextBar editor={activeEditor} />

        <div ref={splitRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
          {/* 分割の有無で左ペインの階層を変えない（変えるとエディタが作り直され、カーソルと Undo 履歴が消える） */}
          <div className="flex min-h-0 min-w-0" style={{ flex: split ? `${ws.splitRatio} 1 0%` : "1 1 0%" }}>
            {pane(0)}
          </div>
          {split && (
            <>
              <div
                role="separator"
                aria-label="ペインの境界（ドラッグで幅を変更）"
                onPointerDown={startResize}
                onDoubleClick={() => dispatch({ type: "set", patch: { splitRatio: 0.5 } })}
                className="h-1 shrink-0 cursor-row-resize touch-none bg-border transition-colors hover:bg-syntax-type md:h-auto md:w-1 md:cursor-col-resize"
              />
              <div className="flex min-h-0 min-w-0" style={{ flex: `${1 - ws.splitRatio} 1 0%` }}>
                {pane(1)}
              </div>
            </>
          )}

          {dragging && (
            <div className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-lg border-2 border-dashed border-syntax-type bg-background/85">
              <p className="font-mono text-sm text-foreground">
                ここにドロップして、新しい文書として読み込む
                <span className="mt-1 block text-center text-xs text-muted-foreground">.txt / .md / .html / .json</span>
              </p>
            </div>
          )}
        </div>

        {/* ステータスバー */}
        <footer className="flex min-h-7 shrink-0 items-stretch border-t border-border bg-card font-mono text-[11px]">
          <span
            className={cn(
              "flex items-center px-3 font-semibold tracking-wider uppercase transition-colors",
              focused ? "bg-brand text-background" : "bg-secondary text-muted-foreground"
            )}
          >
            {focused ? "insert" : "normal"}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-3 px-3 text-muted-foreground">
            <span className="hidden truncate text-foreground sm:inline">{activeFile.name}</span>
            <span className={cn("shrink-0 tabular-nums", over && "text-syntax-tag")}>
              {chars.toLocaleString()}
              {activeFile.target > 0 && ` / ${activeFile.target.toLocaleString()}`} 字
            </span>
            {selectedChars > 0 && <span className="shrink-0 text-syntax-type tabular-nums">選択 {selectedChars.toLocaleString()} 字</span>}
          </span>
          <span
            className={cn("flex shrink-0 items-center gap-1.5 px-3", status === "error" ? "bg-syntax-tag text-background" : "text-muted-foreground")}
            role="status"
            title={status === "error" ? "ブラウザの保存容量を超えた可能性があります。画像を減らすか、バックアップを書き出してください。" : undefined}
          >
            {status === "saved" && <Check className="h-3 w-3 text-syntax-string" />}
            {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "error" && <AlertTriangle className="h-3 w-3" />}
            {{ saved: "保存済み", saving: "保存中…", error: "保存できません" }[status]}
          </span>
        </footer>
      </div>

      {/* 通知 */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-12 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-md border border-border bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-lg"
        >
          <span className="truncate">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="shrink-0 rounded px-2 py-0.5 font-mono text-xs underline underline-offset-4 hover:opacity-80"
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="閉じる" className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" onClick={() => setToast(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 開くたびに作り直して、選択中のリンク・文字を初期値にする */}
      {link.isLinkModalVisible && (
      <LinkModal
        key={`${link.linkModalData.url}|${link.linkModalData.text}`}
        isOpen
        onClose={link.handleLinkCancel}
        initialUrl={link.linkModalData.url}
        initialText={link.linkModalData.text}
        hasSelection={link.linkModalData.text !== ""}
        isEditMode={link.linkModalData.isEditing}
        onSave={link.handleLinkSave}
        onRemove={link.handleLinkRemove}
      />
      )}
      {math && <MathDialog draft={math} onClose={() => setMath(null)} onSubmit={submitMath} onDelete={deleteMath} />}
      {shortcuts && <ShortcutsDialog onClose={() => setShortcuts(false)} />}
      <LaTeXExportModal
        isOpen={latex !== null}
        onClose={() => setLatex(null)}
        onExport={(options, content) => {
          try {
            downloadLaTeXFile(generateLaTeXDocument(content, options), activeFile.name);
          } catch {
            notify("LaTeX への書き出しに失敗しました");
          }
        }}
        content={latex ?? ""}
        filename={activeFile.name}
      />
    </div>
  );
}
