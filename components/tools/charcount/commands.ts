import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";

/**
 * テキストノードごとに変換する（太字などの書式は保つ）。
 * range を渡すと、その範囲に入っている部分だけを変換する（選択範囲への適用）。
 * 以前の実装は先頭から順に置き換えていたため、文字数が変わる変換（句読点＋空白など）で
 * 2 つ目以降の置き換え位置がずれていた。後ろから適用して位置ずれを防ぐ。
 */
export function transformTextNodes(
  editor: Editor,
  fn: (text: string) => string,
  range?: { from: number; to: number }
) {
  const { state } = editor;
  const changes: { from: number; to: number; text: string; marks: PMNode["marks"] }[] = [];
  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const from = Math.max(pos, range?.from ?? pos);
    const to = Math.min(pos + node.text.length, range?.to ?? Infinity);
    if (from >= to) return;
    const original = node.text.slice(from - pos, to - pos);
    const text = fn(original);
    if (text !== original) changes.push({ from, to, text, marks: node.marks });
  });
  if (changes.length === 0) return false;
  const tr = state.tr;
  for (const { from, to, text, marks } of changes.reverse()) {
    // 空文字のテキストノードは作れないので削除にする
    if (text) tr.replaceWith(from, to, state.schema.text(text, marks));
    else tr.delete(from, to);
  }
  editor.view.dispatch(tr);
  return true;
}

/** 本文全体を、1 行 = 1 段落のプレーンテキストで置き換える（コード向けの変換で使う） */
export function replaceWithLines(editor: Editor, lines: string[]) {
  const content = lines.map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" }));
  editor.chain().setContent({ type: "doc", content }, { emitUpdate: true }).run();
}

/** 段落ごとのプレーンテキスト（強制改行は \n） */
export function getLines(editor: Editor): string[] {
  return editor.getText({ blockSeparator: "\n" }).split("\n");
}

/**
 * 改行を削除して 1 つの段落にまとめる。
 * 英数字どうしがつながる所にだけ半角スペースを入れる（日本語の文は詰めてつなぐ）。
 */
export function joinLines(editor: Editor) {
  const lines = getLines(editor).map((l) => l.trim()).filter(Boolean);
  const joined = lines.reduce((acc, line) => {
    if (!acc) return line;
    const needsSpace = /[A-Za-z0-9.,!?;:)]$/.test(acc) && /^[A-Za-z0-9(]/.test(line);
    return acc + (needsSpace ? " " : "") + line;
  }, "");
  replaceWithLines(editor, [joined]);
}

/** 書式（太字・サイズなど）とリスト・引用などのブロックを外し、段落だけにする */
export function clearFormatting(editor: Editor) {
  const { state } = editor;
  const { schema } = state;
  const paragraphs: PMNode[] = [];
  state.doc.descendants((node) => {
    if (!node.isTextblock) return true;
    const inline: PMNode[] = [];
    node.forEach((child) => {
      if (child.isText && child.text) inline.push(schema.text(child.text));
      else if (child.type.name === "hardBreak") inline.push(child.type.create());
    });
    paragraphs.push(schema.nodes.paragraph.create(null, inline));
    return false;
  });
  if (paragraphs.length === 0) paragraphs.push(schema.nodes.paragraph.create());
  editor.view.dispatch(state.tr.replaceWith(0, state.doc.content.size, paragraphs));
}
