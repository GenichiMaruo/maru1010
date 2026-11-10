"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

// ---- 型 ----

export interface ProFile {
  id: string;
  name: string;
  /** Tiptap の HTML */
  content: string;
  /** 一覧に出す文字数（改行を除く） */
  chars: number;
  /** 目標文字数。0 は未設定 */
  target: number;
  updatedAt: number;
}

export interface Workspace {
  files: ProFile[];
  /** 左右のペインに開いているファイル。右が null なら分割なし */
  panes: [string, string | null];
  activePane: 0 | 1;
  /** 左ペインの幅（0〜1） */
  splitRatio: number;
  sidebarOpen: boolean;
  showNewlines: boolean;
  showFullWidthSpaces: boolean;
}

export type SaveStatus = "saved" | "saving" | "error";

// ---- 保存 ----

const KEY = "maru1010.charCountPro.v3";
// 旧バージョンのキー（読み取り専用。移行後も消さない）
const LEGACY_FILES_KEY = "char-count-pro-files";
const LEGACY_STATE_KEY = "charCountPro_appState";
const SAVE_DELAY_MS = 400;

export const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const createFile = (name: string, content = "", chars = 0): ProFile => ({
  id: newId(),
  name,
  content,
  chars,
  target: 0,
  updatedAt: Date.now(),
});

function countChars(html: string): number {
  const el = document.createElement("div");
  el.innerHTML = html;
  return Array.from((el.textContent ?? "").replace(/\n/g, "")).length;
}

function defaults(files: ProFile[]): Workspace {
  return {
    files,
    panes: [files[0].id, null],
    activePane: 0,
    splitRatio: 0.5,
    sidebarOpen: true,
    showNewlines: false,
    showFullWidthSpaces: false,
  };
}

/** 保存データを検証して、壊れている部分は既定値で補う */
function sanitize(raw: Partial<Workspace>): Workspace | null {
  const files = (Array.isArray(raw.files) ? raw.files : []).filter(
    (f): f is ProFile => !!f && typeof f.id === "string" && typeof f.content === "string"
  );
  if (files.length === 0) return null;
  const base = defaults(files);
  const has = (id: unknown): id is string => typeof id === "string" && files.some((f) => f.id === id);
  const left = has(raw.panes?.[0]) ? raw.panes[0] : files[0].id;
  const right = has(raw.panes?.[1]) && raw.panes[1] !== left ? raw.panes[1] : null;
  return {
    ...base,
    files: files.map((f) => ({
      ...f,
      name: typeof f.name === "string" && f.name ? f.name : "無題",
      chars: Number.isFinite(f.chars) ? f.chars : 0,
      target: Number.isFinite(f.target) ? f.target : 0,
      updatedAt: Number.isFinite(f.updatedAt) ? f.updatedAt : Date.now(),
    })),
    panes: [left, right],
    activePane: right && raw.activePane === 1 ? 1 : 0,
    splitRatio: typeof raw.splitRatio === "number" ? Math.min(0.8, Math.max(0.2, raw.splitRatio)) : 0.5,
    sidebarOpen: raw.sidebarOpen ?? true,
    showNewlines: !!raw.showNewlines,
    showFullWidthSpaces: !!raw.showFullWidthSpaces,
  };
}

/** 旧バージョン（v1）の保存データを読み込む */
function loadLegacy(): Workspace | null {
  type LegacyFile = { id?: unknown; name?: unknown; content?: unknown; lastSaved?: unknown };
  let legacyFiles: LegacyFile[] = [];
  let legacyState: { fileTabs?: LegacyFile[]; targetLength?: number; showNewlineMarkers?: boolean; showFullWidthSpaces?: boolean } = {};
  try {
    legacyState = JSON.parse(localStorage.getItem(LEGACY_STATE_KEY) ?? "{}") ?? {};
  } catch {}
  try {
    legacyFiles = JSON.parse(localStorage.getItem(LEGACY_FILES_KEY) ?? "[]") ?? [];
  } catch {}
  if (!Array.isArray(legacyFiles) || legacyFiles.length === 0) legacyFiles = legacyState.fileTabs ?? [];
  if (!Array.isArray(legacyFiles)) return null;

  const target = typeof legacyState.targetLength === "number" ? legacyState.targetLength : 0;
  const files = legacyFiles
    .filter((f) => typeof f?.content === "string")
    .map((f) => {
      const content = f.content as string;
      const saved = typeof f.lastSaved === "string" ? Date.parse(f.lastSaved) : NaN;
      return {
        id: newId(),
        name: typeof f.name === "string" && f.name ? f.name : "無題",
        content,
        chars: countChars(content),
        target,
        updatedAt: Number.isFinite(saved) && saved > 0 ? saved : Date.now(),
      } satisfies ProFile;
    });
  // 旧版は空の「Untitled」を必ず 1 つ作るので、それだけなら移行しない
  if (files.length === 0 || files.every((f) => f.chars === 0)) return null;
  return {
    ...defaults(files),
    showNewlines: !!legacyState.showNewlineMarkers,
    showFullWidthSpaces: !!legacyState.showFullWidthSpaces,
  };
}

function load(): Workspace {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const ws = sanitize(JSON.parse(raw));
      if (ws) return ws;
    }
  } catch {}
  try {
    const legacy = loadLegacy();
    if (legacy) return legacy;
  } catch {}
  return defaults([createFile("無題")]);
}

// ---- reducer ----

type Action =
  | { type: "content"; id: string; content: string; chars: number }
  | { type: "patchFile"; id: string; patch: Partial<Pick<ProFile, "name" | "target">> }
  | { type: "addFiles"; files: ProFile[]; open: boolean }
  | { type: "restoreFile"; file: ProFile; index: number }
  | { type: "deleteFile"; id: string }
  | { type: "moveFile"; from: number; to: number }
  | { type: "open"; id: string; pane?: 0 | 1 }
  | { type: "focusPane"; pane: 0 | 1 }
  | { type: "toggleSplit" }
  | { type: "closePane"; pane: 0 | 1 }
  | { type: "set"; patch: Partial<Pick<Workspace, "splitRatio" | "sidebarOpen" | "showNewlines" | "showFullWidthSpaces">> };

function openIn(ws: Workspace, id: string, pane: 0 | 1): Workspace {
  // 分割していなければ、左（唯一のペイン）に開く
  if (pane === 1 && ws.panes[1] === null) pane = 0;
  const panes: (string | null)[] = [...ws.panes];
  const other = pane === 0 ? 1 : 0;
  // 同じファイルを左右に同時には開かない（編集が衝突するため）。相手側で開いていたら入れ替える
  if (panes[other] === id) panes[other] = panes[pane];
  panes[pane] = id;
  return { ...ws, panes: [panes[0] ?? id, panes[1]], activePane: pane };
}

function reducer(ws: Workspace, action: Action): Workspace {
  switch (action.type) {
    case "content":
      return {
        ...ws,
        files: ws.files.map((f) =>
          f.id === action.id ? { ...f, content: action.content, chars: action.chars, updatedAt: Date.now() } : f
        ),
      };
    case "patchFile":
      return { ...ws, files: ws.files.map((f) => (f.id === action.id ? { ...f, ...action.patch } : f)) };
    case "addFiles": {
      if (action.files.length === 0) return ws;
      const next = { ...ws, files: [...ws.files, ...action.files] };
      return action.open ? openIn(next, action.files[0].id, ws.activePane) : next;
    }
    case "restoreFile": {
      const files = [...ws.files];
      files.splice(Math.min(action.index, files.length), 0, action.file);
      return openIn({ ...ws, files }, action.file.id, ws.activePane);
    }
    case "deleteFile": {
      let files = ws.files.filter((f) => f.id !== action.id);
      if (files.length === 0) files = [createFile("無題")];
      let [left, right] = ws.panes;
      const unused = (exclude: (string | null)[]) => files.find((f) => !exclude.includes(f.id))?.id ?? null;
      if (right === action.id) right = null;
      if (left === action.id) {
        left = right ?? unused([]) ?? files[0].id;
        if (left === right) right = null;
      }
      return { ...ws, files, panes: [left, right], activePane: right ? ws.activePane : 0 };
    }
    case "moveFile": {
      if (action.from === action.to) return ws;
      const files = [...ws.files];
      const [moved] = files.splice(action.from, 1);
      files.splice(action.to, 0, moved);
      return { ...ws, files };
    }
    case "open":
      return openIn(ws, action.id, action.pane ?? ws.activePane);
    case "focusPane":
      return ws.panes[action.pane] && ws.activePane !== action.pane ? { ...ws, activePane: action.pane } : ws;
    case "toggleSplit": {
      if (ws.panes[1]) return { ...ws, panes: [ws.panes[ws.activePane]!, null], activePane: 0 };
      // 右側には、いま開いていない別のファイルを出す。無ければ新しく作る
      const other = ws.files.find((f) => f.id !== ws.panes[0]);
      if (other) return { ...ws, panes: [ws.panes[0], other.id], activePane: 1 };
      const file = createFile("無題 2");
      return { ...ws, files: [...ws.files, file], panes: [ws.panes[0], file.id], activePane: 1 };
    }
    case "closePane": {
      const keep = ws.panes[action.pane === 0 ? 1 : 0];
      return keep ? { ...ws, panes: [keep, null], activePane: 0 } : ws;
    }
    case "set":
      return { ...ws, ...action.patch };
  }
}

// ---- hook ----

/**
 * ワークスペースの状態と自動保存。
 * 変更から少し待って localStorage に書き、タブを閉じる・隠すときは即座に書く。
 * クライアント専用（localStorage から初期化する）なので、SSR しないコンポーネントから使う。
 */
export function useWorkspace() {
  const [ws, rawDispatch] = useReducer(reducer, undefined, load);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const dispatch = useCallback((action: Action) => {
    rawDispatch(action);
    setStatus((s) => (s === "error" ? s : "saving"));
  }, []);
  const wsRef = useRef(ws);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current);
    if (!dirtyRef.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(wsRef.current));
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      // 容量オーバーなど。黙って失うと危険なので、画面に出し続ける
      setStatus("error");
    }
  }, []);

  // 初回（旧データから移行した直後など）も含めて、変更のたびに保存を予約する
  useEffect(() => {
    wsRef.current = ws;
    dirtyRef.current = true;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [ws, flush]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return { ws, dispatch, status, flush };
}

export type WorkspaceDispatch = ReturnType<typeof useWorkspace>["dispatch"];
