import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type VisualCueOptions = { newlines: boolean; fullWidthSpaces: boolean };

const key = new PluginKey<VisualCueOptions>("charcountVisualCues");

/**
 * 強制改行（Shift+Enter）の目印。中身は空で、記号は CSS（.cue-br::before）で描く。
 * 文字を持たない・編集できない要素にしておくと、カーソルが入り込んだり、
 * 選択範囲やコピーに記号が混ざったりしない。
 */
function breakMarker() {
  const el = document.createElement("span");
  el.className = "cue-br";
  el.contentEditable = "false";
  el.setAttribute("aria-hidden", "true");
  return el;
}

/**
 * 改行記号と全角スペースの表示（どちらも表示だけで、本文には一切含まれない）。
 * - 段落の終わり ¶：段落要素に class を付け、CSS の ::after で描く（DOM に要素を足さない）
 * - 強制改行 ↵：中身が空の編集不可の目印を置き、CSS で描く
 * 表示設定はプラグインの state に持ち、setVisualCues() で切り替える。
 * （以前は設定を変えるたびにエディタを作り直していたため、Undo 履歴とカーソル位置が消えていた）
 */
export const VisualCues = Extension.create({
  name: "charcountVisualCues",
  addProseMirrorPlugins() {
    return [
      new Plugin<VisualCueOptions>({
        key,
        state: {
          init: () => ({ newlines: false, fullWidthSpaces: false }),
          apply: (tr, value) => (tr.getMeta(key) as VisualCueOptions | undefined) ?? value,
        },
        props: {
          decorations(state) {
            const options = key.getState(state);
            if (!options || (!options.newlines && !options.fullWidthSpaces)) return null;
            const decorations: Decoration[] = [];
            const { doc } = state;
            doc.descendants((node, pos) => {
              if (options.fullWidthSpaces && node.isText && node.text) {
                for (const match of node.text.matchAll(/　/g)) {
                  const from = pos + (match.index ?? 0);
                  decorations.push(Decoration.inline(from, from + 1, { class: "full-width-space-highlight" }));
                }
              }
              if (!options.newlines) return;
              if (node.type.name === "hardBreak") {
                decorations.push(
                  Decoration.widget(pos, breakMarker, { side: -1, key: "cue-br", ignoreSelection: true, marks: [] })
                );
              } else if (node.isTextblock && !node.type.spec.code && pos + node.nodeSize < doc.content.size) {
                // コードブロックの中の改行は文字そのものなので付けない。文書の最後の段落にも付けない
                const empty = node.content.size === 0;
                decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: empty ? "cue-eol cue-eol-empty" : "cue-eol" }));
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export function setVisualCues(editor: Editor, options: VisualCueOptions) {
  if (editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(key, options).setMeta("addToHistory", false));
}
