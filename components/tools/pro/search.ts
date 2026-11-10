import { Extension, type Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface SearchQuery {
  text: string;
  caseSensitive: boolean;
  regex: boolean;
}

interface Match {
  from: number;
  to: number;
}

interface SearchState {
  query: SearchQuery | null;
  matches: Match[];
  /** 現在の一致。無ければ -1 */
  index: number;
  /** 正規表現が不正なとき */
  invalid: boolean;
}

const key = new PluginKey<SearchState>("proSearch");
const EMPTY: SearchState = { query: null, matches: [], index: -1, invalid: false };

function buildRegExp(query: SearchQuery): RegExp | null {
  if (!query.text) return null;
  const source = query.regex ? query.text : query.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    return new RegExp(source, query.caseSensitive ? "gu" : "giu");
  } catch {
    return null;
  }
}

/**
 * 段落などのテキストブロックごとに検索する。
 * 太字の途中などでテキストノードが分かれていても一致するよう、ブロック内の文字列をつないでから探す。
 * （インラインの要素はどれも位置 1 つ分なので、文字列の添字がそのまま文書内の位置に対応する）
 */
function findMatches(doc: PMNode, query: SearchQuery): { matches: Match[]; invalid: boolean } {
  const re = buildRegExp(query);
  if (!re) return { matches: [], invalid: !!query.text };
  const matches: Match[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = "";
    node.forEach((child) => {
      text += child.isText ? child.text : "￼";
    });
    re.lastIndex = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (m[0].length === 0) {
        re.lastIndex++; // 空文字に一致する正規表現で止まらないようにする
        continue;
      }
      matches.push({ from: pos + 1 + m.index, to: pos + 1 + m.index + m[0].length });
      if (matches.length >= 5000) return false;
    }
    return false;
  });
  return { matches, invalid: false };
}

type Meta = { type: "query"; query: SearchQuery | null; near?: number } | { type: "index"; index: number };

export const Search = Extension.create({
  name: "proSearch",
  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key,
        state: {
          init: () => EMPTY,
          apply(tr, prev, _old, state) {
            const meta = tr.getMeta(key) as Meta | undefined;
            if (meta?.type === "index") return { ...prev, index: meta.index };
            if (meta?.type === "query") {
              if (!meta.query || !meta.query.text) return EMPTY;
              const found = findMatches(state.doc, meta.query);
              // カーソル以降の最初の一致を「現在の一致」にする
              const near = meta.near ?? 0;
              const after = found.matches.findIndex((m) => m.from >= near);
              const index = found.matches.length === 0 ? -1 : after === -1 ? 0 : after;
              return { query: meta.query, ...found, index };
            }
            if (!tr.docChanged || !prev.query) return prev;
            // 本文が変わったら探し直し、現在の一致は近い位置に保つ
            const found = findMatches(state.doc, prev.query);
            const from = prev.index >= 0 ? tr.mapping.map(prev.matches[prev.index]?.from ?? 0) : 0;
            const after = found.matches.findIndex((m) => m.from >= from);
            const index = found.matches.length === 0 ? -1 : after === -1 ? 0 : after;
            return { query: prev.query, ...found, index };
          },
        },
        props: {
          decorations(state) {
            const s = key.getState(state);
            if (!s || s.matches.length === 0) return null;
            return DecorationSet.create(
              state.doc,
              s.matches.map((m, i) =>
                Decoration.inline(m.from, m.to, { class: i === s.index ? "search-match search-match-current" : "search-match" })
              )
            );
          },
        },
      }),
    ];
  },
});

export const getSearchState = (editor: Editor): SearchState => key.getState(editor.state) ?? EMPTY;

export function setSearchQuery(editor: Editor, query: SearchQuery | null) {
  if (editor.isDestroyed) return;
  const meta: Meta = { type: "query", query, near: editor.state.selection.from };
  editor.view.dispatch(editor.state.tr.setMeta(key, meta).setMeta("addToHistory", false));
  revealCurrent(editor);
}

function revealCurrent(editor: Editor) {
  const s = getSearchState(editor);
  const match = s.matches[s.index];
  if (!match) return;
  // 検索欄にフォーカスを残したまま、一致箇所が見える位置までスクロールする
  const dom = editor.view.domAtPos(match.from).node;
  const el = dom instanceof Element ? dom : dom.parentElement;
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function stepSearch(editor: Editor, direction: 1 | -1) {
  const s = getSearchState(editor);
  if (s.matches.length === 0) return;
  const index = (s.index + direction + s.matches.length) % s.matches.length;
  const meta: Meta = { type: "index", index };
  editor.view.dispatch(editor.state.tr.setMeta(key, meta).setMeta("addToHistory", false));
  revealCurrent(editor);
}

/** 置換後の文字列。正規表現のときは $1 などの参照を展開する */
function replacementFor(editor: Editor, match: Match, query: SearchQuery, replacement: string) {
  if (!query.regex) return replacement;
  const re = buildRegExp(query);
  if (!re) return replacement;
  const original = editor.state.doc.textBetween(match.from, match.to, "", "￼");
  return original.replace(new RegExp(re.source, re.flags.replace("g", "")), replacement);
}

export function replaceCurrent(editor: Editor, replacement: string) {
  const s = getSearchState(editor);
  const match = s.matches[s.index];
  if (!match || !s.query) return;
  const text = replacementFor(editor, match, s.query, replacement);
  const tr = editor.state.tr;
  if (text) tr.insertText(text, match.from, match.to);
  else tr.delete(match.from, match.to);
  editor.view.dispatch(tr);
  revealCurrent(editor);
}

/** すべて置換して、置換した件数を返す（1 回の「元に戻す」で戻せる） */
export function replaceAll(editor: Editor, replacement: string): number {
  const s = getSearchState(editor);
  if (s.matches.length === 0 || !s.query) return 0;
  const tr = editor.state.tr;
  // 後ろから置換して位置ずれを防ぐ
  for (const match of [...s.matches].reverse()) {
    const text = replacementFor(editor, match, s.query, replacement);
    if (text) tr.insertText(text, match.from, match.to);
    else tr.delete(match.from, match.to);
  }
  editor.view.dispatch(tr);
  return s.matches.length;
}

/** 検索を閉じるとき：現在の一致を選択した状態にして、ハイライトを消す */
export function closeSearch(editor: Editor) {
  if (editor.isDestroyed) return;
  const s = getSearchState(editor);
  const match = s.matches[s.index];
  const tr = editor.state.tr.setMeta(key, { type: "query", query: null } satisfies Meta).setMeta("addToHistory", false);
  if (match) tr.setSelection(TextSelection.create(tr.doc, match.from, match.to));
  editor.view.dispatch(tr);
}
