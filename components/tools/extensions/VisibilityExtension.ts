import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";

// Enhanced visibility extension for special characters and markers
export const VisibilityExtension = Extension.create<{
  showParagraphMarkers: boolean;
  showNewlineMarkers: boolean;
  showFullWidthSpaces: boolean;
}>({
  name: "visibility",
  addOptions() {
    return {
      showParagraphMarkers: false,
      showNewlineMarkers: false,
      showFullWidthSpaces: false,
    };
  },
  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin({
        key: new PluginKey("visibility"),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              // 全角スペースの強調表示
              if (options.showFullWidthSpaces && node.isText && node.text) {
                const text = node.text;
                // 全角スペース（U+3000）を検出
                const fullWidthSpaceRegex = /\u3000/g;
                let match;
                while ((match = fullWidthSpaceRegex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + 1;
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: "full-width-space-highlight",
                      style:
                        "background-color: rgba(59, 130, 246, 0.3); border-radius: 2px; border: 1px solid rgba(59, 130, 246, 0.5);",
                    })
                  );
                }
              }

              // 改行マーカー（hardBreak）
              if (
                options.showNewlineMarkers &&
                node.type.name === "hardBreak"
              ) {
                decorations.push(
                  Decoration.widget(
                    pos,
                    () => {
                      const markerElement = document.createElement("span");
                      markerElement.textContent = "↵";
                      markerElement.className =
                        "text-blue-500 text-xs font-mono inline-block select-none opacity-60";
                      return markerElement;
                    },
                    {
                      side: 1,
                      marks: [],
                      key: `hardbreak-${pos}`,
                    }
                  )
                );
              }

              // 段落の終わりマーカー
              if (
                options.showParagraphMarkers &&
                node.isBlock &&
                node.type.name === "paragraph" &&
                node.content.size > 0
              ) {
                // 段落の最後にマーカーを表示（ドキュメントの最後でない場合）
                if (pos + node.nodeSize < doc.content.size) {
                  decorations.push(
                    Decoration.widget(
                      pos + node.nodeSize - 1,
                      () => {
                        const markerElement = document.createElement("span");
                        markerElement.textContent = "¶";
                        markerElement.className =
                          "text-gray-400 text-xs font-mono inline-block ml-1 select-none opacity-50";
                        return markerElement;
                      },
                      {
                        side: 1,
                        marks: [],
                        key: `paragraph-end-${pos + node.nodeSize - 1}`,
                      }
                    )
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
