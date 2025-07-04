/**
 * Editor operations for text transformation and formatting
 * These functions work with Tiptap editor instances
 */

import { Editor } from "@tiptap/react";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  toWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  removeComments as removeCommentsFromText,
  normalizeWhitespace as normalizeWhitespaceText,
  CaseConversionType,
  CommentLanguage,
} from "@/utils/textTransformUtils";

/**
 * Apply text transformation while preserving formatting marks
 */
export const transformTextInEditorPreservingMarks = (
  editor: Editor,
  transformFunction: (text: string) => string,
  onUpdate?: () => void
) => {
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
    onUpdate?.();
  }
};

/**
 * Apply case conversion to selected text or entire document
 */
export const applyCaseConversion = (
  editor: Editor,
  conversionType: CaseConversionType,
  onUpdate?: () => void
) => {
  const conversionFunctions = {
    camelCase: toCamelCase,
    PascalCase: toPascalCase,
    snake_case: toSnakeCase,
    "kebab-case": toKebabCase,
  };

  const conversionFunc = conversionFunctions[conversionType];

  transformTextInEditorPreservingMarks(
    editor,
    (text) => {
      const words = toWords(text);
      if (words.length === 0 && text.trim().length > 0) {
        return conversionFunc([text.toLowerCase()]);
      }
      if (words.length === 0) return text;
      return conversionFunc(words);
    },
    onUpdate
  );
};

/**
 * Remove newlines from editor content
 */
export const removeNewlines = (editor: Editor, onUpdate?: () => void) => {
  if (!editor) return;

  // 1. Replace newlines in text nodes with spaces
  transformTextInEditorPreservingMarks(
    editor,
    (text) => text.replace(/(\r?\n|\u2028|\u2029)/g, " "),
    onUpdate
  );

  // 2. Replace all hardBreak nodes with spaces
  editor.commands.command(({ tr, state, dispatch }) => {
    let transactionModified = false;
    state.doc.descendants((node, pos) => {
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
      onUpdate?.();
      return true;
    }
    return false;
  });

  // 3. Convert all block elements to text with hardBreaks
  editor.commands.command(({ tr, state, dispatch }) => {
    const { doc, schema } = state;
    const lines: string[] = [];

    doc.forEach((node) => {
      if (
        node.type.name === "paragraph" ||
        node.type.name === "listItem" ||
        node.type.name === "blockquote" ||
        node.type.name === "codeBlock"
      ) {
        const text = node.textContent;
        if (text.trim() !== "") lines.push(text);
      } else if (
        node.type.name === "bulletList" ||
        node.type.name === "orderedList"
      ) {
        node.forEach((child) => {
          if (child.type.name === "listItem") {
            const text = child.textContent;
            if (text.trim() !== "") lines.push(text);
          }
        });
      }
    });

    // Join sections with hardBreaks
    const frag = [];
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) frag.push(schema.nodes.hardBreak.create());
      frag.push(schema.text(lines[i]));
    }

    if (frag.length > 0) {
      tr.replaceWith(0, doc.content.size, frag);
      if (dispatch) {
        dispatch(tr);
        onUpdate?.();
      }
      return true;
    }
    return false;
  });
};

/**
 * Clear all formatting from editor content
 */
export const clearFormatting = (editor: Editor, onUpdate?: () => void) => {
  if (!editor) return;

  // 1. Clear all marks
  editor.chain().focus().unsetAllMarks().run();

  // 2. Convert all block elements to paragraphs
  editor.commands.command(({ tr, state, dispatch }) => {
    const { doc, schema } = state;
    const newNodes: ProseMirrorNode[] = [];

    doc.forEach((node) => {
      if (node.isBlock && node.type !== schema.nodes.paragraph) {
        if (node.content.size > 0) {
          newNodes.push(schema.nodes.paragraph.create(null, node.content));
        } else if (
          newNodes.length === 0 ||
          newNodes[newNodes.length - 1].type !== schema.nodes.paragraph
        ) {
          newNodes.push(schema.nodes.paragraph.create());
        }
      } else {
        newNodes.push(node.copy(node.content));
      }
    });

    tr.replaceWith(0, doc.content.size, newNodes);
    if (dispatch) dispatch(tr);
    onUpdate?.();
    return true;
  });
};

/**
 * Remove comments from editor content
 */
export const removeComments = (
  editor: Editor,
  language: CommentLanguage,
  onUpdate?: () => void
) => {
  if (!editor) return;

  transformTextInEditorPreservingMarks(
    editor,
    (text) => removeCommentsFromText(text, language),
    onUpdate
  );
};

/**
 * Copy editor content to clipboard
 */
export const copyToClipboard = async (editor: Editor): Promise<boolean> => {
  if (!editor) return false;

  const textToCopy = editor.getText();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } else {
      // Fallback for older browsers
      return copyToClipboardFallback(textToCopy);
    }
  } catch (error) {
    console.error("Clipboard API error:", error);
    return copyToClipboardFallback(textToCopy);
  }
};

/**
 * Normalize whitespace characters to single half-width spaces
 */
export const normalizeWhitespace = (editor: Editor, onUpdate?: () => void) => {
  transformTextInEditorPreservingMarks(
    editor,
    normalizeWhitespaceText,
    onUpdate
  );
};

/**
 * Fallback clipboard method for older browsers
 */
const copyToClipboardFallback = (text: string): boolean => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard error:", err);
    document.body.removeChild(textArea);
    return false;
  }
};
