import { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";

interface LinkModalData {
  url: string;
  text: string;
  isEditing: boolean;
}

export function useLinkModal(editor: Editor | null) {
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [linkModalData, setLinkModalData] = useState<LinkModalData>({
    url: "",
    text: "",
    isEditing: false,
  });

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // 既存のリンクがある場合は編集
    const currentLink = editor.getAttributes("link").href;
    
    if (currentLink) {
      // 既存リンクを編集
      setLinkModalData({
        url: currentLink,
        text: selectedText || "",
        isEditing: true,
      });
    } else if (selectedText && selectedText.startsWith("http")) {
      // 選択されたテキストがURLの場合
      setLinkModalData({
        url: selectedText,
        text: "",
        isEditing: false,
      });
    } else {
      // 新しいリンク作成
      setLinkModalData({
        url: "",
        text: selectedText || "",
        isEditing: false,
      });
    }
    
    setIsLinkModalVisible(true);
  }, [editor]);

  const handleLinkSave = useCallback(
    (url: string, text: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;

      if (linkModalData.isEditing) {
        // 既存リンクの編集
        if (text && from !== to) {
          // テキストも変更する場合
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(text)
            .setTextSelection({ from, to: from + text.length })
            .setLink({ href: url })
            .run();
        } else {
          // URLのみ変更
          editor.chain().focus().setLink({ href: url }).run();
        }
      } else {
        // 新しいリンクの挿入
        if (from === to) {
          // 選択範囲がない場合
          const linkText =
            text || url.replace(/^https?:\/\//, "").replace(/\/$/, "") || url;
          const position = editor.state.selection.from;
          editor
            .chain()
            .focus()
            .insertContent(linkText)
            .setTextSelection({
              from: position,
              to: position + linkText.length,
            })
            .setLink({ href: url })
            .run();
        } else {
          // 選択範囲がある場合
          if (text && text !== editor.state.doc.textBetween(from, to)) {
            // テキストを変更する場合
            editor
              .chain()
              .focus()
              .deleteSelection()
              .insertContent(text)
              .setTextSelection({ from, to: from + text.length })
              .setLink({ href: url })
              .run();
          } else {
            // 選択されたテキストをそのまま使用
            editor.chain().focus().setLink({ href: url }).run();
          }
        }
      }

      setIsLinkModalVisible(false);
    },
    [editor, linkModalData.isEditing]
  );

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().unsetLink().run();

    setIsLinkModalVisible(false);
  }, [editor]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkModalVisible(false);
  }, []);

  return {
    isLinkModalVisible,
    linkModalData,
    openLinkModal,
    handleLinkSave,
    handleLinkRemove,
    handleLinkCancel,
  };
}
