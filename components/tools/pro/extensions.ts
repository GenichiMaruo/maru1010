import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Mathematics from "@tiptap/extension-mathematics";
import { common, createLowlight } from "lowlight";
import scala from "highlight.js/lib/languages/scala";
import { FontSizeExtension } from "@/components/tools/extensions";
import { VisualCues } from "@/components/tools/charcount/visualCues";
import { Search } from "./search";

// ハイライト用の定義は 1 回だけ作る（以前は描画のたびに作り直していた）
const lowlight = createLowlight(common);
lowlight.register("scala", scala);

/** コードブロックの言語の選択肢 */
export const CODE_LANGUAGES = [
  ["plaintext", "Plain Text"],
  ["bash", "Bash"],
  ["c", "C"],
  ["cpp", "C++"],
  ["csharp", "C#"],
  ["css", "CSS"],
  ["diff", "Diff"],
  ["go", "Go"],
  ["xml", "HTML / XML"],
  ["java", "Java"],
  ["javascript", "JavaScript"],
  ["json", "JSON"],
  ["kotlin", "Kotlin"],
  ["markdown", "Markdown"],
  ["php", "PHP"],
  ["python", "Python"],
  ["ruby", "Ruby"],
  ["rust", "Rust"],
  ["scala", "Scala"],
  ["sql", "SQL"],
  ["swift", "Swift"],
  ["typescript", "TypeScript"],
  ["yaml", "YAML"],
] as const;

/** 本文中の数式をクリックしたときの通知（React 側で編集ダイアログを開く） */
export const MATH_EDIT_EVENT = "pro-math-edit";
export interface MathEditDetail {
  kind: "inline" | "block";
  latex: string;
  pos: number;
}
const emitMathEdit = (kind: MathEditDetail["kind"]) => (node: { attrs: Record<string, unknown> }, pos: number) =>
  window.dispatchEvent(
    new CustomEvent<MathEditDetail>(MATH_EDIT_EVENT, { detail: { kind, latex: String(node.attrs.latex ?? ""), pos } })
  );

/** Tab：リスト・表の中ではそれぞれの既定の動作（字下げ・セル移動）、それ以外ではタブ文字を入れる */
const TabIndent = Extension.create({
  name: "proTabIndent",
  priority: 50, // リストや表のキー設定より後に試す
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive("listItem") || editor.isActive("taskItem") || editor.isActive("table")) return false;
        return editor.commands.insertContent("\t");
      },
    };
  },
});

/** 文書が空のときだけ、書き始めの案内を出す */
const EmptyHint = Extension.create({
  name: "proEmptyHint",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc }) => {
            const first = doc.firstChild;
            if (doc.childCount !== 1 || !first?.isTextblock || first.content.size > 0) return null;
            return DecorationSet.create(doc, [
              Decoration.node(0, first.nodeSize, {
                class: "is-editor-empty",
                "data-placeholder": "ここに入力…（# で見出し、- で箇条書き）",
              }),
            ]);
          },
        },
      }),
    ];
  },
});

export function createExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      },
    }),
    TextStyle,
    FontSizeExtension.configure({ requireSelection: false }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList.configure({ HTMLAttributes: { class: "task-list" } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: "task-item" } }),
    Image.configure({ inline: false, allowBase64: true }),
    Mathematics.configure({
      inlineOptions: { onClick: emitMathEdit("inline") },
      blockOptions: { onClick: emitMathEdit("block") },
      katexOptions: { throwOnError: false },
    }),
    VisualCues,
    Search,
    TabIndent,
    EmptyHint,
  ];
}
