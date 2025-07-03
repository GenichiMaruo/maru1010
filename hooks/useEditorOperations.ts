import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { Node as ProseMirrorNode } from "prosemirror-model";
import {
  toWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  jpToEnPunctuation,
  enToJpPunctuation,
  removeComments,
  removeNewlinesFromText,
  removeWhitespace,
} from "@/utils/textTransformUtils";

export const useEditorOperations = (editor: Editor | null) => {
  // テキスト変換（マークを保持）
  const transformTextInEditorPreservingMarks = useCallback(
    (transformFunction: (text: string) => string) => {
      if (!editor) return;
      const { state } = editor;
      const view = editor.view;
      const { tr, doc, schema } = state;
      let modified = false;

      doc.descendants((node: ProseMirrorNode, pos: number) => {
        if (!node.isText) {
          return true;
        }
        const originalText = node.text;
        if (!originalText) {
          return false;
        }
        const newText = transformFunction(originalText);
        if (newText !== originalText) {
          const from = pos;
          const to = pos + originalText.length;
          const newNode = schema.text(newText, node.marks);
          tr.replaceWith(from, to, newNode);
          modified = true;
        }
        return false;
      });

      if (modified) {
        view.dispatch(tr);
      }
    },
    [editor]
  );

  // ケース変換
  const applyCaseConversion = useCallback(
    (conversionFunc: (words: string[]) => string) => {
      transformTextInEditorPreservingMarks((text) => {
        const words = toWords(text);
        if (words.length === 0 && text.trim().length > 0) {
          return conversionFunc([text.toLowerCase()]);
        }
        if (words.length === 0) return text;
        return conversionFunc(words);
      });
    },
    [transformTextInEditorPreservingMarks]
  );

  const handleConvertToCamelCase = useCallback(
    () => applyCaseConversion(toCamelCase),
    [applyCaseConversion]
  );
  const handleConvertToPascalCase = useCallback(
    () => applyCaseConversion(toPascalCase),
    [applyCaseConversion]
  );
  const handleConvertToSnakeCase = useCallback(
    () => applyCaseConversion(toSnakeCase),
    [applyCaseConversion]
  );
  const handleConvertToKebabCase = useCallback(
    () => applyCaseConversion(toKebabCase),
    [applyCaseConversion]
  );

  // 句読点変換
  const handleJpToEnPunctuation = useCallback(
    () => transformTextInEditorPreservingMarks(jpToEnPunctuation),
    [transformTextInEditorPreservingMarks]
  );

  const handleEnToJpPunctuation = useCallback(
    () => transformTextInEditorPreservingMarks(enToJpPunctuation),
    [transformTextInEditorPreservingMarks]
  );

  // コメント削除
  const handleRemoveComments = useCallback(
    (selectedLanguage: string) => {
      if (!selectedLanguage || !editor) return;
      transformTextInEditorPreservingMarks((text) =>
        removeComments(text, selectedLanguage)
      );
    },
    [editor, transformTextInEditorPreservingMarks]
  );

  // 改行削除
  const handleRemoveNewlines = useCallback(() => {
    if (!editor) return;

    // 1. テキストノード内の改行や特殊改行文字をスペースに置換
    transformTextInEditorPreservingMarks(removeNewlinesFromText);

    // 2. すべての hardBreak ノードをスペースに置換
    editor.commands.command(({ tr, state, dispatch }) => {
      let transactionModified = false;
      state.doc.descendants((node: ProseMirrorNode, pos: number) => {
        if (node.type.name === "hardBreak") {
          if (dispatch) {
            tr.replaceWith(
              pos,
              pos + node.nodeSize,
              state.schema.text(" ", node.marks)
            );
          }
          transactionModified = true;
        }
        return true;
      });
      if (transactionModified && dispatch) {
        dispatch(tr);
        return true;
      }
      return false;
    });
  }, [editor, transformTextInEditorPreservingMarks]);

  // 空白削除（ダブルクリック対応）
  const handleRemoveWhitespaces = useCallback(
    (lastClickTime: number, threshold: number = 300) => {
      if (!editor) return;
      const { state, view } = editor;
      const { tr } = state;
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;
      const changes: { from: number; to: number; text: string }[] = [];

      state.doc.descendants((node: ProseMirrorNode, pos: number) => {
        if (!node.isText || !node.text) return;
        const originalText = node.text;
        const newText = removeWhitespace(
          originalText,
          timeSinceLastClick < threshold
        );

        if (newText !== originalText) {
          changes.push({
            from: pos,
            to: pos + originalText.length,
            text: newText,
          });
        }
      });

      // 逆順で適用（位置ズレ防止）
      for (const change of changes.reverse()) {
        tr.insertText(change.text, change.from, change.to);
      }
      if (tr.docChanged) {
        view.dispatch(tr);
      }

      return timeSinceLastClick < threshold ? 0 : now;
    },
    [editor]
  );

  // フォーマットクリア
  const handleClearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().run();
    editor.chain().focus().setParagraph().run();
  }, [editor]);

  // テキストクリア
  const handleClearText = useCallback(() => {
    if (!editor) return;
    editor.commands.clearContent(true);
  }, [editor]);

  // コピー機能
  const handleCopyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!editor) return false;
    const textToCopy = editor.getText();

    try {
      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } else {
        // フォールバック
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error("Copy failed:", error);
      return false;
    }
  }, [editor]);

  // 検索・置換
  const handleSearch = useCallback(
    (searchTerm: string): boolean => {
      if (!editor || !searchTerm) return false;
      const text = editor.getText();
      const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (index !== -1) {
        editor.commands.focus();
        return true;
      }
      return false;
    },
    [editor]
  );

  const handleReplace = useCallback(
    (searchTerm: string, replaceTerm: string) => {
      if (!editor || !searchTerm) return;
      transformTextInEditorPreservingMarks((text) =>
        text.replace(new RegExp(searchTerm, "gi"), replaceTerm)
      );
    },
    [editor, transformTextInEditorPreservingMarks]
  );

  return {
    handleConvertToCamelCase,
    handleConvertToPascalCase,
    handleConvertToSnakeCase,
    handleConvertToKebabCase,
    handleJpToEnPunctuation,
    handleEnToJpPunctuation,
    handleRemoveComments,
    handleRemoveNewlines,
    handleRemoveWhitespaces,
    handleClearFormatting,
    handleClearText,
    handleCopyToClipboard,
    handleSearch,
    handleReplace,
  };
};
