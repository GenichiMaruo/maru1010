import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";

// Visibility extension for special characters
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
                let match;
                const regex = /　/g;
                while ((match = regex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + 1;
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: "full-width-space-highlight",
                    })
                  );
                }
              }

              // 改行マーカー（hardBreak と段落の終わり）
              if (options.showNewlineMarkers) {
                // hardBreak（Shift+Enter）の場合
                if (node.type.name === "hardBreak") {
                  decorations.push(
                    Decoration.widget(
                      pos,
                      () => {
                        const markerElement = document.createElement("span");
                        markerElement.className = "hard-break-marker";
                        markerElement.textContent = "↲";
                        return markerElement;
                      },
                      {
                        side: -1,
                        marks: [],
                        key: `hardbreak-marker-${pos}`,
                      }
                    )
                  );
                }

                // 段落の終わり（通常のEnter）の場合
                if (node.type.name === "paragraph" && node.content.size > 0) {
                  const endPos = pos + node.nodeSize - 1;
                  decorations.push(
                    Decoration.widget(
                      endPos,
                      () => {
                        const markerElement = document.createElement("span");
                        markerElement.className = "paragraph-end-marker";
                        markerElement.textContent = "↲";
                        return markerElement;
                      },
                      {
                        side: 1,
                        marks: [],
                        key: `paragraph-end-marker-${endPos}`,
                      }
                    )
                  );
                }
              }

              // 段落マーカー
              if (
                options.showParagraphMarkers &&
                node.type.name === "paragraph" &&
                node.content.size === 0
              ) {
                decorations.push(
                  Decoration.widget(
                    pos + 1,
                    () => {
                      const markerElement = document.createElement("span");
                      markerElement.className = "paragraph-marker";
                      markerElement.textContent = "¶";
                      return markerElement;
                    },
                    {
                      side: -1,
                      marks: [],
                      key: `paragraph-marker-${pos}`,
                    }
                  )
                );
              }

              return true;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
