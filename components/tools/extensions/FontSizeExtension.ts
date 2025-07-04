import { Extension } from "@tiptap/core";

// TypeScript module augmentation for Tiptap commands
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

// Custom FontSize extension for Tiptap
export const FontSizeExtension = Extension.create<{
  types?: string[];
  sizes?: string[];
}>({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
      sizes: ["12", "14", "16", "18", "20", "24"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types ?? [],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace("px", ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain, state }) => {
          // 選択範囲がある場合のみフォントサイズを適用
          const { from, to } = state.selection;
          if (from === to) {
            // 選択範囲がない場合は何もしない
            return false;
          }
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain, state }) => {
          // 選択範囲がある場合のみフォントサイズを解除
          const { from, to } = state.selection;
          if (from === to) {
            // 選択範囲がない場合は何もしない
            return false;
          }
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
