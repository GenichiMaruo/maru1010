import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";

interface TiptapRendererProps {
  markdownContent?: string;
  /** 親コンポーネントから追加のクラス名を渡せるようにするためのオプション */
  className?: string;
}

const TiptapRenderer: React.FC<TiptapRendererProps> = ({
  markdownContent,
  className,
}) => {
  const htmlContent = markdownContent
    ? marked(markdownContent, { gfm: true, breaks: true })
    : "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
        dropcursor: false,
        gapcursor: false,
      }),
    ],
    content: htmlContent,
    editable: false,
  });

  if (!editor) {
    return null;
  }

  const customStylingBaseClass = "tiptap-custom-styles";
  // props経由で渡されたclassNameと結合
  const wrapperClassName = `${customStylingBaseClass} ${
    className || ""
  }`.trim();

  return (
    <>
      <div className={wrapperClassName}>
        <EditorContent editor={editor} />
      </div>

      {/* 提供されたグローバルJSXスタイル */}
      <style jsx global>{`
        .tiptap-custom-styles .ProseMirror {
          min-height: 200px; /* コンテンツが短い場合でも最低限の高さを確保 */
          /* 必要に応じてここにさらにProseMirrorエディタ自体のスタイルを追加 */
        }
        .tiptap-custom-styles p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          line-height: 1.7;
        }
        .tiptap-custom-styles h1,
        .tiptap-custom-styles h2,
        .tiptap-custom-styles h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #e2e8f0; /* 薄いグレー、ダークモード向けの色かもしれません */
          /* ライトモードでの表示も考慮する場合、CSS変数やダークモードセレクタでの調整が必要 */
        }
        /* 以下、提供されたスタイルをそのまま記述 */
        .tiptap-custom-styles ul {
          list-style: none;
          padding-left: 0;
        }
        .tiptap-custom-styles ul > li {
          padding-left: 2em;
          position: relative;
          margin-bottom: 0.6em;
          line-height: 1.7;
        }
        .tiptap-custom-styles ul > li::before {
          content: "•";
          color: #38bdf8; /* sky-500 */
          font-size: 1.3em;
          position: absolute;
          left: 0.6em;
          top: -0.05em;
          line-height: inherit;
        }
        .tiptap-custom-styles ul ul {
          margin-top: 0.3em;
          padding-left: 1.5em; /* ネストされたリストのインデント */
        }
        .tiptap-custom-styles ul ul > li::before {
          content: "◦"; /* 白丸 */
          color: #7dd3fc; /* sky-300 */
          font-size: 1.1em;
          left: 0.5em;
        }
        .tiptap-custom-styles ul ul ul > li::before {
          content: "▪"; /* 四角 */
          color: #bae6fd; /* sky-200 */
          font-size: 1em;
          left: 0.4em;
        }
        .tiptap-custom-styles ol {
          list-style: none;
          padding-left: 0;
          counter-reset: item; /* 番号付きリストのカウンターをリセット */
        }
        .tiptap-custom-styles ol > li {
          padding-left: 2.2em;
          position: relative;
          margin-bottom: 0.6em;
          counter-increment: item; /* カウンターを増やす */
          line-height: 1.7;
        }
        .tiptap-custom-styles ol > li::before {
          content: counter(item) "."; /* カウンターを表示 */
          color: #38bdf8; /* sky-500 */
          font-weight: 600;
          position: absolute;
          left: 0.3em;
          top: 0;
          line-height: inherit;
          min-width: 1.5em; /* 番号が2桁以上になっても揃うように */
          text-align: right;
          padding-right: 0.6em; /* 番号とテキストの間のスペース */
        }
        .tiptap-custom-styles ol ol {
          margin-top: 0.3em;
          padding-left: 1.5em;
        }
        .tiptap-custom-styles ol ol > li::before {
          content: counter(item, lower-alpha) "."; /* a, b, c... */
        }
        .tiptap-custom-styles ol ol ol > li::before {
          content: counter(item, lower-roman) "."; /* i, ii, iii... */
        }
        .tiptap-custom-styles blockquote {
          border-left: 3px solid #38bdf8; /* sky-500 */
          color: #94a3b8; /* slate-400 */
          padding-left: 1em;
          margin-left: 0; /* Tailwind proseのスタイルを打ち消す場合など */
          font-style: italic;
        }
        .tiptap-custom-styles pre {
          background-color: #1e293b; /* slate-800 */
          color: #e2e8f0; /* slate-200 */
          border-radius: 0.375rem; /* rounded-md */
          padding: 0.75em 1em;
          border: 1px solid #334155; /* slate-700 */
          overflow-x: auto; /* 横スクロール */
        }
        /* 以下のスタイルは主に編集可能なエディタ向けですが、念のため含めます */
        .tiptap-editor-wrapper {
          border-radius: 0.375rem; /* rounded-md */
          overflow: hidden;
        }
        .tiptap-editor-wrapper > div {
          /* .ProseMirrorを想定 */
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        .TiptapMenuBar-button.is-active {
          background-color: rgba(
            14,
            165,
            233,
            0.5
          ) !important; /* sky-600 with opacity */
          color: #e0f2fe !important; /* sky-100 */
        }

        /* Visual Cues Styles (編集モードで役立つスタイル) */
        .hard-break-marker {
          color: #38bdf8 !important; /* sky-500 */
          background: rgba(56, 189, 248, 0.18); /* sky-400/18 (近似) */
          border-radius: 3px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          font-size: 0.95em;
          opacity: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          vertical-align: middle;
          margin-left: 2px;
          padding: 0 2px;
          box-shadow: 0 0 0 1.5px rgba(56, 189, 248, 0.15);
        }
        .paragraph-end-marker {
          color: #fb923c !important; /* orange-400 */
          background: rgba(251, 146, 60, 0.15);
          border-radius: 3px;
          border: 1px solid rgba(251, 146, 60, 0.32);
          font-size: 0.95em;
          opacity: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          vertical-align: middle;
          margin-left: 2px;
          padding: 0 2px;
          box-shadow: 0 0 0 1.5px rgba(251, 146, 60, 0.13);
        }
        .tiptap-icon-widget > svg {
          /* SVGアイコンのスタイル調整が必要な場合 */
        }
        .full-width-space-highlight {
          background-color: rgba(255, 235, 59, 0.15); /* yellow-300/15 (近似) */
          outline: 1px dotted rgba(255, 193, 7, 0.4); /* yellow-500/40 (近似) */
          border-radius: 1px;
        }
      `}</style>
    </>
  );
};

export default TiptapRenderer;
