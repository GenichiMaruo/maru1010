"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import runes from "runes2";
import {
  FaTextHeight,
  FaParagraph,
  FaAlignLeft,
  FaRegCopy,
  FaCheck,
  FaKeyboard,
  FaRegComments,
  FaLanguage,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
  FaMinus, // For Horizontal Rule
  FaUndo,
  FaRedo,
  FaEraser, // For Clear Formatting
  FaEye, // For Show
  FaEyeSlash, // For Hide
  // FaCrow, // Substitute for Paragraph mark (¶)
  FaExpandArrowsAlt, // For Full-width space
} from "react-icons/fa";
import { FaSyncAlt } from "react-icons/fa";
import {
  MdOutlineSubdirectoryArrowLeft,
  MdOutlineArrowDownward,
} from "react-icons/md"; // Added MdOutlineArrowDownward
import { FaRegTrashCan } from "react-icons/fa6";

// Tiptap imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyleExtension from "@tiptap/extension-text-style";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import { Extension, RawCommands, CommandProps } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, EditorState } from "prosemirror-state";

// Import createRoot for rendering React components into Tiptap widgets
import { createRoot } from "react-dom/client";

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
const FontSizeExtension = Extension.create<{
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
            parseHTML: (element) => element.style.fontSize?.replace(/px$/, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize || attributes.fontSize === "null") {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: CommandProps): boolean => {
          return chain().setMark("textStyle", { fontSize: fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: CommandProps): boolean => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    } as RawCommands;
  },
});

// Tiptap Extension to show visual cues (newline markers, full-width spaces)
const VisualCuesExtension = (options: {
  showNewlineMarkers: boolean;
  showFullWidthSpaceHighlight: boolean;
}) =>
  Extension.create({
    name: "visualCues",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            decorations(state: EditorState) {
              const decorations: Decoration[] = [];
              const { doc } = state;

              doc.descendants((node, pos) => {
                // Full-width space highlighting
                if (
                  options.showFullWidthSpaceHighlight &&
                  node.isText &&
                  node.text
                ) {
                  const fullWidthSpaceRegex = /\u3000/g;
                  let match;
                  while (
                    (match = fullWidthSpaceRegex.exec(node.text as string)) !==
                    null
                  ) {
                    decorations.push(
                      Decoration.inline(
                        pos + match.index,
                        pos + match.index + match[0].length,
                        {
                          class: "full-width-space-highlight",
                        }
                      )
                    );
                  }
                }

                // Newline markers
                if (options.showNewlineMarkers) {
                  if (node.type.name === "hardBreak") {
                    decorations.push(
                      Decoration.widget(
                        pos, // Position for the widget
                        () => {
                          // toDOM function
                          const markerElement = document.createElement("span");
                          markerElement.className =
                            "hard-break-marker tiptap-icon-widget";
                          const reactRoot = createRoot(markerElement);
                          reactRoot.render(<MdOutlineSubdirectoryArrowLeft />);
                          // Store root for unmounting
                          (
                            markerElement as HTMLSpanElement & {
                              pmRoot?: ReturnType<typeof createRoot>;
                            }
                          ).pmRoot = reactRoot;
                          return markerElement;
                        },
                        {
                          // Spec for the widget
                          side: 1, // Render after the node
                          marks: [],
                          key: `hardbreak-marker-${pos}`, // Unique key
                          destroy: (node: Node) => {
                            // Cleanup on destroy
                            type WithPmRoot = Node & {
                              pmRoot?: ReturnType<typeof createRoot>;
                            };
                            const nodeWithPmRoot = node as WithPmRoot;
                            if (nodeWithPmRoot.pmRoot) {
                              nodeWithPmRoot.pmRoot.unmount();
                            }
                          },
                        }
                      )
                    );
                  } else if (
                    node.isBlock &&
                    node.type.name === "paragraph" &&
                    node.content.size > 0 // Only for non-empty paragraphs
                  ) {
                    // Check if it's not the last node in the document to avoid marker after everything
                    if (pos + node.nodeSize < doc.content.size) {
                      decorations.push(
                        Decoration.widget(
                          pos + node.nodeSize - 1, // Position at the end of paragraph content
                          () => {
                            // toDOM function
                            const markerElement =
                              document.createElement("span");
                            markerElement.className =
                              "paragraph-end-marker tiptap-icon-widget";
                            const reactRoot = createRoot(markerElement);
                            reactRoot.render(<MdOutlineArrowDownward />);
                            // Store root for unmounting
                            (
                              markerElement as HTMLSpanElement & {
                                pmRoot?: ReturnType<typeof createRoot>;
                              }
                            ).pmRoot = reactRoot;
                            return markerElement;
                          },
                          {
                            // Spec for the widget
                            side: 1, // Render after the character at the position
                            marks: [],
                            key: `paragraph-end-marker-${
                              pos + node.nodeSize - 1
                            }`, // Unique key
                            destroy: (domNode) => {
                              // Cleanup on destroy
                              const nodeWithPmRoot = domNode as HTMLElement & {
                                pmRoot?: ReturnType<typeof createRoot>;
                              };
                              if (nodeWithPmRoot.pmRoot) {
                                nodeWithPmRoot.pmRoot.unmount();
                              }
                            },
                          }
                        )
                      );
                    }
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

const StatDisplay = ({
  icon,
  value,
  tooltipText,
}: {
  icon: React.ReactNode;
  value: string | number;
  tooltipText: string;
}) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300 ease-in-out cursor-default shadow-sm border border-white/10 min-w-0">
          <div className="text-xl md:text-2xl text-sky-400 mb-1">{icon}</div>
          <p className="text-base md:text-xl font-semibold text-slate-100 truncate">
            {value}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[150px] text-sm">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
const toWords = (str: string): string[] => {
  if (!str) return [];
  str = str.replace(/([a-z])([A-Z])/g, "$1 $2");
  str = str.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
  str = str.replace(/[\s_-]+/g, " ");
  str = str.trim();
  if (!str) return [];
  return str.split(" ").map((word) => word.toLowerCase());
};
const toCamelCase = (words: string[]): string =>
  words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
const toPascalCase = (words: string[]): string =>
  words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
const toSnakeCase = (words: string[]): string => words.join("_");
const toKebabCase = (words: string[]): string => words.join("-");

const TiptapMenuBar = ({
  editor,
}: {
  editor: ReturnType<typeof useEditor> | null;
}) => {
  if (!editor) {
    return null;
  }
  const fontSizeOptions = [
    { label: "小", value: "12" },
    { label: "標準", value: "null" },
    { label: "大", value: "18" },
    { label: "特大", value: "24" },
  ];
  const menuButtonBaseClass = "TiptapMenuBar-button";
  const activeClass = "is-active";
  const hoverClass = "hover:bg-slate-700";
  const getButtonClass = (isActive: boolean) =>
    `${menuButtonBaseClass} ${isActive ? activeClass : ""} ${hoverClass}`;
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-slate-700 rounded-t-md bg-slate-800/80">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={getButtonClass(editor.isActive("bold"))}
      >
        <FaBold />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={getButtonClass(editor.isActive("italic"))}
      >
        <FaItalic />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={getButtonClass(editor.isActive("underline"))}
      >
        <FaUnderline />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={getButtonClass(editor.isActive("strike"))}
      >
        <FaStrikethrough />
      </Button>
      <Select
        onValueChange={(value) => {
          if (value === "null") {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(value).run();
          }
        }}
        value={editor.getAttributes("textStyle").fontSize || "null"}
      >
        <SelectTrigger className="w-[80px] h-8 text-xs bg-slate-700/80 border-slate-600 hover:bg-slate-600/90 focus:ring-sky-500">
          <SelectValue placeholder="サイズ" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
          {fontSizeOptions.map((opt) => (
            <SelectItem
              key={opt.label}
              value={opt.value}
              className="text-xs hover:bg-slate-700 focus:bg-sky-600/30"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={getButtonClass(editor.isActive("bulletList"))}
      >
        <FaListUl />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={getButtonClass(editor.isActive("orderedList"))}
      >
        <FaListOl />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={getButtonClass(editor.isActive("blockquote"))}
      >
        <FaQuoteLeft />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={getButtonClass(editor.isActive("codeBlock"))}
      >
        <FaCode />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={`${menuButtonBaseClass} ${hoverClass}`}
      >
        <FaMinus />
      </Button>
      <div className="flex-grow"></div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={`${menuButtonBaseClass} ${hoverClass}`}
      >
        <FaUndo />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={`${menuButtonBaseClass} ${hoverClass}`}
      >
        <FaRedo />
      </Button>
    </div>
  );
};

const LOCAL_STORAGE_KEY = "characterCountApp_tiptap_v2"; // Changed key to avoid conflicts with old versions
const LOCAL_STORAGE_SETTINGS_KEY = "characterCountApp_settings_v2";

export default function CharacterCountTab() {
  const [plainTextForCounts, setPlainTextForCounts] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  // States for visual cue toggles
  const [showNewlineMarkers, setShowNewlineMarkers] = useState<boolean>(false);
  const [showFullWidthSpaceHighlight, setShowFullWidthSpaceHighlight] =
    useState<boolean>(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          hardBreak: false, // Keep this false if you want HardBreak extension to handle all <br>
        }),
        VisualCuesExtension({
          // This will be reconfigured when state changes
          showNewlineMarkers,
          showFullWidthSpaceHighlight,
        }),
        TextStyleExtension,
        FontSizeExtension,
        Underline,
        HardBreak.extend({
          // Explicitly add HardBreak if not fully handled by StarterKit or for custom behavior
          // Example: keepMarks: false, // if you want to customize
        }),
      ],
      content:
        typeof window !== "undefined"
          ? localStorage.getItem(LOCAL_STORAGE_KEY) || ""
          : "",
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-4 min-h-[200px] bg-slate-900/70 border border-slate-700 border-t-0 rounded-b-md text-slate-100 tiptap-custom-styles",
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        const html = currentEditor.getHTML();
        const plainText = currentEditor.getText();
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, html);
        }
        setPlainTextForCounts(plainText);
      },
    },
    [showNewlineMarkers, showFullWidthSpaceHighlight] // Re-initialize editor when these change
  );

  useEffect(() => {
    if (!editor) return;
    setPlainTextForCounts(editor.getText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Load settings from local storage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setShowNewlineMarkers(settings.showNewlineMarkers || false);
      setShowFullWidthSpaceHighlight(
        settings.showFullWidthSpaceHighlight || false
      );
    }
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    const settings = { showNewlineMarkers, showFullWidthSpaceHighlight };
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [showNewlineMarkers, showFullWidthSpaceHighlight]);

  const runeCount = runes(plainTextForCounts.replace(/\n/g, "")).length;
  const wordCount =
    plainTextForCounts.trim() === ""
      ? 0
      : plainTextForCounts.trim().split(/\s+/).length;
  // 修正: 連続する改行も1行としてカウントし、末尾の空行も除外
  const lineCount =
    plainTextForCounts.trim() === ""
      ? 0
      : plainTextForCounts
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split(/\n+/)
          .filter((line) => line.trim() !== "").length;

  const transformTextInEditorPreservingMarks = (
    transformFunction: (text: string) => string
  ) => {
    if (!editor) return;
    const { state, view } = editor;
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
      setPlainTextForCounts(editor.getText());
    }
  };

  const handleRemoveNewlines = () => {
    if (!editor) return;

    // 1. テキストノード内の改行や特殊改行文字をスペースに置換（既存処理）
    transformTextInEditorPreservingMarks((text) =>
      text.replace(/(\r?\n|\u2028|\u2029)/g, " ")
    );

    // 2. すべての hardBreak ノードをスペースに置換（既存処理）
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
        setPlainTextForCounts(editor.getText());
        return true;
      }
      return false;
    });

    // 3. セクション（段落・リスト・引用など）をすべてテキスト＋hardBreakのみに変換
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
      // 各セクションを hardBreak で連結
      const frag = [];
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) frag.push(schema.nodes.hardBreak.create());
        frag.push(schema.text(lines[i]));
      }
      if (frag.length > 0) {
        tr.replaceWith(0, doc.content.size, frag);
        if (dispatch) {
          dispatch(tr);
          setPlainTextForCounts(editor.getText());
        }
        return true;
      }
      return false;
    });
  };

  const handleClearFormatting = () => {
    if (!editor) return;

    // 1. すべての書式（マーク）をクリア
    editor.chain().focus().unsetAllMarks().run();

    // 2. ブロック要素（リスト・引用・コードブロックなど）をパラグラフに変換
    editor
      .chain()
      .focus()
      .setParagraph()
      .liftListItem("listItem") // Ensure this is correct for your schema if using custom list item names
      // .liftListItem("orderedList") // Lifting the list itself might not be what you want, usually lift items
      // .liftListItem("bulletList")
      .unsetBlockquote() // This should turn blockquotes into paragraphs
      .clearNodes() // This command clears the content of selected nodes, or all nodes if a type is not specified. Be careful.
      // If the goal is to convert all block types to paragraph, setParagraph on each relevant block might be better.
      .run();

    // A more robust way to convert all block content to paragraphs:
    editor.commands.command(({ tr, state, dispatch }) => {
      const { doc, schema } = state;
      const newNodes: ProseMirrorNode[] = [];
      doc.forEach((node) => {
        if (node.isBlock && node.type !== schema.nodes.paragraph) {
          // Convert node to paragraph, preserving content
          if (node.content.size > 0) {
            newNodes.push(schema.nodes.paragraph.create(null, node.content));
          } else if (
            newNodes.length === 0 ||
            newNodes[newNodes.length - 1].type !== schema.nodes.paragraph
          ) {
            // Add an empty paragraph if needed to maintain structure, but avoid multiple empty ones
            newNodes.push(schema.nodes.paragraph.create());
          }
        } else {
          newNodes.push(node.copy(node.content));
        }
      });
      tr.replaceWith(0, doc.content.size, newNodes);
      if (dispatch) dispatch(tr);
      return true;
    });

    // 3. パラグラフの区切りをすべて hardBreak に変換
    // すべての段落をテキスト＋hardBreakのみにする
    editor.commands.command(({ tr, state, dispatch }) => {
      const { doc, schema } = state;
      const newContent: ProseMirrorNode[] = [];
      let firstParagraph = true;

      doc.forEach((node) => {
        if (node.type.name === "paragraph") {
          if (!firstParagraph && node.content.size > 0) {
            // Add hardBreak before non-first, non-empty paragraphs
            newContent.push(schema.nodes.hardBreak.create());
          }
          if (node.content.size > 0) {
            node.content.forEach((inlineNode) => {
              newContent.push(inlineNode);
            });
          } else if (firstParagraph && newContent.length === 0) {
            // If it's the very first empty paragraph, let it be (or handle as needed)
            // This logic might need adjustment based on desired outcome for leading/multiple empty paragraphs
          }
          firstParagraph = false;
        } else if (node.isText) {
          // Handle loose text nodes if any (should ideally be in paragraphs)
          newContent.push(node);
        }
        // Other block types should have been converted to paragraphs by now
      });

      // If newContent is empty and original doc wasn't, create a single empty paragraph
      if (doc.content.size > 0 && newContent.length === 0) {
        newContent.push(schema.nodes.paragraph.create());
      } else if (newContent.length > 0) {
        // Ensure the final content is wrapped in a paragraph if it's just inline content
        // This step might be complex depending on how strictly "all hardBreak" is interpreted
        // For now, we assume the content collected is a flat list of inline nodes and hardBreaks
      }

      if (newContent.length > 0) {
        tr.replaceWith(
          0,
          doc.content.size,
          schema.nodes.paragraph.create(null, newContent)
        );
      } else {
        // If everything was cleared, ensure there's at least one empty paragraph
        tr.replaceWith(0, doc.content.size, schema.nodes.paragraph.create());
      }

      if (dispatch) dispatch(tr);
      setPlainTextForCounts(editor.getText());
      return true;
    });
  };
  const lastWhitespaceClickTimeRef = useRef(0);
  const DOUBLE_CLICK_THRESHOLD_MS = 300;

  const handleRemoveWhitespaces = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastWhitespaceClickTimeRef.current;
    if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD_MS) {
      transformTextInEditorPreservingMarks((text) =>
        text.replace(/[ \t\u3000]+/g, " ").trim()
      );
      lastWhitespaceClickTimeRef.current = 0;
    } else {
      transformTextInEditorPreservingMarks((text) =>
        text.replace(/[ \t\u3000]/g, "")
      );
      lastWhitespaceClickTimeRef.current = now;
    }
  };

  const handleJpToEnPunctuation = () =>
    transformTextInEditorPreservingMarks((text) =>
      text.replace(/、/g, ", ").replace(/。/g, ". ")
    );
  const handleEnToJpPunctuation = () =>
    transformTextInEditorPreservingMarks((text) =>
      text.replace(/,/g, "、").replace(/\./g, "。")
    );

  const handleRemoveComments = () => {
    if (!selectedLanguage || !editor) return;
    let transformFn: (text: string) => string;
    switch (selectedLanguage) {
      case "generic_block_line":
        transformFn = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
        break;
      case "hash_comments":
        transformFn = (text) => text.replace(/#.*/g, "");
        break;
      case "html_comments":
        transformFn = (text) => text.replace(/<!--[\s\S]*?-->/g, "");
        break; // Corrected Regex
      default: {
        console.warn(
          "Unsupported language for comment removal:",
          selectedLanguage
        );
        return;
      }
    }
    transformTextInEditorPreservingMarks(transformFn);
  };

  const applyCaseConversion = (conversionFunc: (words: string[]) => string) => {
    transformTextInEditorPreservingMarks((text) => {
      const words = toWords(text);
      if (words.length === 0 && text.trim().length > 0) {
        // Handle cases like "HelloWorld" without spaces if toWords doesn't split them as desired
        // This might need a more sophisticated word splitting for mixed case strings if that's the input.
        // For now, if toWords returns nothing but there's text, apply to the whole string as one "word".
        return conversionFunc([text.toLowerCase()]); // Or handle as per specific needs
      }
      if (words.length === 0) return text; // Truly empty or whitespace only
      return conversionFunc(words);
    });
  };
  const handleConvertToCamelCase = () => applyCaseConversion(toCamelCase);
  const handleConvertToPascalCase = () => applyCaseConversion(toPascalCase);
  const handleConvertToSnakeCase = () => applyCaseConversion(toSnakeCase);
  const handleConvertToKebabCase = () => applyCaseConversion(toKebabCase);

  const [confirmClear, setConfirmClear] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClearClick = () => {
    if (!editor) return;
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeoutRef.current = setTimeout(() => setConfirmClear(false), 3000);
    } else {
      editor.commands.clearContent(true); // Pass true to emit update
      setPlainTextForCounts(""); // Explicitly clear plain text state
      setConfirmClear(false);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    }
  };

  const handleCopyToClipboard = () => {
    if (!editor) return;
    const textToCopy = editor.getText();
    if (typeof navigator.clipboard?.writeText === "function") {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Clipboard API error:", err);
          tryCopyLegacy(textToCopy);
        });
    } else {
      tryCopyLegacy(textToCopy);
    }
  };

  const tryCopyLegacy = (textToCopy: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed"; // Ensure it's not visible
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let successful = false;
    try {
      successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback: Failed to copy text using execCommand");
        // Consider showing a user message here if execCommand also fails
      }
    } catch (err) {
      console.error("Fallback: Error copying text using execCommand", err);
      // Consider showing a user message here
    }
    document.body.removeChild(textArea);
  };

  const languages = [
    { value: "generic_block_line", label: "標準 (// と /* */)" },
    { value: "hash_comments", label: "ハッシュ (#)" },
    { value: "html_comments", label: "HTML ()" }, // Corrected label
  ];
  const caseConversionOptions = [
    {
      label: "キャメル",
      handler: handleConvertToCamelCase,
      tooltip: "例: helloWorld",
      color:
        "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200",
    },
    {
      label: "パスカル",
      handler: handleConvertToPascalCase,
      tooltip: "例: HelloWorld",
      color:
        "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:text-emerald-200",
    },
    {
      label: "スネーク",
      handler: handleConvertToSnakeCase,
      tooltip: "例: hello_world",
      color:
        "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300 hover:text-rose-200",
    },
    {
      label: "ケバブ",
      handler: handleConvertToKebabCase,
      tooltip: "例: hello-world",
      color:
        "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:text-amber-200",
    },
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl text-slate-50 flex flex-col gap-0 py-3">
      <CardHeader className="px-6 pt-4 pb-2 flex justify-center items-center">
        <FaKeyboard className="text-4xl text-sky-300/90 drop-shadow" />
        <CardTitle className="text-2xl md:text-3xl font-semibold text-slate-100 mx-2">
          文字数カウンター
        </CardTitle>
        <FaKeyboard className="text-4xl text-sky-300/90 drop-shadow" />
      </CardHeader>
      <CardContent className="space-y-3 px-4 md:px-6 py-3">
        <TiptapMenuBar editor={editor} />
        <EditorContent editor={editor} className="tiptap-editor-wrapper" />
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 pt-2">
          <StatDisplay
            icon={<FaTextHeight />}
            value={runeCount}
            tooltipText="文字数 (改行を除く書記素単位)"
          />
          <StatDisplay
            icon={<FaParagraph />}
            value={wordCount}
            tooltipText="単語数"
          />
          <StatDisplay
            icon={<FaAlignLeft />}
            value={lineCount}
            tooltipText="行数"
          />
        </div>
      </CardContent>

      <style jsx global>{`
        .tiptap-custom-styles .ProseMirror {
          min-height: 200px;
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
          color: #e2e8f0;
        }
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
          color: #38bdf8;
          font-size: 1.3em;
          position: absolute;
          left: 0.6em;
          top: -0.05em;
          line-height: inherit;
        }
        .tiptap-custom-styles ul ul {
          margin-top: 0.3em;
          padding-left: 1.5em;
        }
        .tiptap-custom-styles ul ul > li::before {
          content: "◦";
          color: #7dd3fc;
          font-size: 1.1em;
          left: 0.5em;
        }
        .tiptap-custom-styles ul ul ul > li::before {
          content: "▪";
          color: #bae6fd;
          font-size: 1em;
          left: 0.4em;
        }
        .tiptap-custom-styles ol {
          list-style: none;
          padding-left: 0;
          counter-reset: item;
        }
        .tiptap-custom-styles ol > li {
          padding-left: 2.2em;
          position: relative;
          margin-bottom: 0.6em;
          counter-increment: item;
          line-height: 1.7;
        }
        .tiptap-custom-styles ol > li::before {
          content: counter(item) ".";
          color: #38bdf8;
          font-weight: 600;
          position: absolute;
          left: 0.3em;
          top: 0;
          line-height: inherit;
          min-width: 1.5em;
          text-align: right;
          padding-right: 0.6em;
        }
        .tiptap-custom-styles ol ol {
          margin-top: 0.3em;
          padding-left: 1.5em;
        }
        .tiptap-custom-styles ol ol > li::before {
          content: counter(item, lower-alpha) ".";
        }
        .tiptap-custom-styles ol ol ol > li::before {
          content: counter(item, lower-roman) ".";
        }
        .tiptap-custom-styles blockquote {
          border-left: 3px solid #38bdf8;
          color: #94a3b8;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .tiptap-custom-styles pre {
          background-color: #1e293b;
          color: #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.75em 1em;
          border: 1px solid #334155;
        }
        .tiptap-editor-wrapper {
          border-radius: 0.375rem;
          overflow: hidden;
        }
        .tiptap-editor-wrapper > div {
          /* Targets .ProseMirror */
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        .TiptapMenuBar-button.is-active {
          background-color: rgba(14, 165, 233, 0.5) !important;
          color: #e0f2fe !important;
        }

        /* Visual Cues Styles */
        .hard-break-marker,
        .paragraph-end-marker {
          color: #475569; /* slate-600 */
          font-size: 0.8em; /* Icons will inherit this size */
          opacity: 0.7;
          display: inline-flex; /* Changed to inline-flex for better icon alignment */
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          vertical-align: middle; /* Adjust vertical alignment if needed */
        }
        .hard-break-marker {
          margin-left: 2px;
        }
        .paragraph-end-marker {
          margin-left: 2px;
        }
        .tiptap-icon-widget > svg {
          /* Style the SVG directly if needed */
          /* width: 1em; */ /* Example: control size explicitly */
          /* height: 1em; */
        }

        .full-width-space-highlight {
          background-color: rgba(255, 235, 59, 0.15);
          outline: 1px dotted rgba(255, 193, 7, 0.4);
          border-radius: 1px;
        }
      `}</style>

      <Tabs
        defaultValue="general"
        className="w-full px-0"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="flex w-full justify-around gap-1 bg-slate-700/30 rounded-none px-2 md:px-4 py-0.5 border-y border-slate-700/50 flex-wrap">
          <TabsTrigger
            value="general"
            className="flex-1 data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            基本機能
          </TabsTrigger>
          <TabsTrigger
            value="formatting"
            className="flex-1 data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            テキスト整形
          </TabsTrigger>
          <TabsTrigger
            value="programming"
            className="flex-1 data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            プログラミング
          </TabsTrigger>
        </TabsList>

        <CardFooter className="flex flex-col gap-3 md:px-6 px-4 pt-3 pb-4">
          <TabsContent value="general" className="w-full mt-0 space-y-3">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 pt-1">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        onClick={() => setShowNewlineMarkers((prev) => !prev)}
                        variant="outline"
                        className={`w-full transition-colors duration-200 rounded-lg flex items-center justify-center px-3 py-2 ${
                          showNewlineMarkers
                            ? "bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30"
                            : "bg-slate-600/30 hover:bg-slate-600/50 border-slate-500/50 text-slate-300 hover:text-slate-200"
                        }`}
                      >
                        {showNewlineMarkers ? (
                          <FaEye className="mr-2 h-4 w-4" />
                        ) : (
                          <FaEyeSlash className="mr-2 h-4 w-4" />
                        )}
                        <span
                          className="mr-1 h-4 w-4 flex items-center justify-center" // Adjusted for icon
                          style={{ fontSize: "1em" }} // Ensure icon size is consistent
                        >
                          <MdOutlineSubdirectoryArrowLeft />
                        </span>
                        改行マーク
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      改行記号（段落末尾の記号と強制改行の記号）の表示を切り替えます。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        onClick={() =>
                          setShowFullWidthSpaceHighlight((prev) => !prev)
                        }
                        variant="outline"
                        className={`w-full transition-colors duration-200 rounded-lg flex items-center justify-center px-3 py-2 ${
                          showFullWidthSpaceHighlight
                            ? "bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30"
                            : "bg-slate-600/30 hover:bg-slate-600/50 border-slate-500/50 text-slate-300 hover:text-slate-200"
                        }`}
                      >
                        {showFullWidthSpaceHighlight ? (
                          <FaEye className="mr-2 h-4 w-4" />
                        ) : (
                          <FaEyeSlash className="mr-2 h-4 w-4" />
                        )}
                        <FaExpandArrowsAlt className="mr-1 h-3 w-3 transform rotate-45" />
                        全角空白
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>全角スペースの強調表示を切り替えます。</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-700/50">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg"
                disabled={!plainTextForCounts}
              >
                {copied ? (
                  <FaCheck className="mr-2 h-4 w-4 text-green-400" />
                ) : (
                  <FaRegCopy className="mr-2 h-4 w-4" />
                )}
                {copied ? "コピー完了" : "テキストをコピー"}
              </Button>
              <Button
                onClick={handleClearClick}
                variant="outline"
                className={`w-full sm:w-auto transition-colors duration-200 rounded-lg ${
                  confirmClear
                    ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300 hover:text-red-200"
                    : "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300 hover:text-pink-200"
                }`}
                disabled={!plainTextForCounts && !editor?.isEmpty} // Disable if editor is empty
              >
                {confirmClear ? (
                  <>
                    <FaRegTrashCan className="mr-2 h-4 w-4" /> 本当にクリア？
                  </>
                ) : (
                  <>
                    <FaRegTrashCan className="mr-2 h-4 w-4" /> クリア
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="w-full mt-0 space-y-3">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-1">
              <Button
                onClick={handleRemoveNewlines}
                variant="outline"
                className="w-full sm:flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:text-yellow-200 transition-colors duration-200 rounded-lg"
                disabled={!plainTextForCounts}
              >
                改行を削除
              </Button>
              <Button
                onClick={handleRemoveWhitespaces}
                variant="outline"
                className="w-full sm:flex-1 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 hover:text-purple-200 transition-colors duration-200 rounded-lg"
                disabled={!plainTextForCounts}
              >
                空白を削除
              </Button>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:flex-1">
                      <Button
                        onClick={handleClearFormatting}
                        variant="outline"
                        className="w-full bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/30 text-gray-300 hover:text-gray-200 transition-colors duration-200 rounded-lg"
                        disabled={!plainTextForCounts}
                      >
                        <FaEraser className="mr-2 h-4 w-4 flex-shrink-0" />
                        書式をクリア
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      全ての書式（太字、斜体、フォントサイズなど）をリセットし、プレーンテキストに近い状態（段落と強制改行のみ）に戻します。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-2 border-t border-slate-700/50">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:flex-1">
                      <Button
                        onClick={handleJpToEnPunctuation}
                        variant="outline"
                        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:text-cyan-200 transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center"
                        disabled={!plainTextForCounts}
                      >
                        <FaLanguage className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">「、。」→「, .」</span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      日本語の句読点（、。）を英語スタイル（, .）に変換します。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:flex-1">
                      <Button
                        onClick={handleEnToJpPunctuation}
                        variant="outline"
                        className="w-full bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/30 text-lime-300 hover:text-lime-200 transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center"
                        disabled={!plainTextForCounts}
                      >
                        <FaLanguage className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">「, .」→「、。」</span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      英語の句読点（, .）を日本語スタイル（、。）に変換します。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsContent>

          <TabsContent value="programming" className="w-full mt-0 space-y-3">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-1">
              <div className="w-full sm:w-auto sm:flex-grow mb-2 sm:mb-0 sm:mr-2">
                <Select
                  onValueChange={setSelectedLanguage}
                  value={selectedLanguage}
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/70 hover:bg-slate-700/80 text-slate-200 focus:ring-sky-500 rounded-lg">
                          <SelectValue placeholder="コメントタイプを選択..." />
                        </SelectTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                        <p>削除したいコメントのタイプを選択してください。</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-lg">
                    {languages.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className="hover:bg-slate-700 focus:bg-sky-600/30 cursor-pointer"
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:w-auto">
                      <Button
                        onClick={handleRemoveComments}
                        variant="outline"
                        className="w-full sm:w-auto bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 text-teal-300 hover:text-teal-200 transition-colors duration-200 rounded-lg px-4 py-2 flex items-center justify-center"
                        disabled={!plainTextForCounts || !selectedLanguage}
                      >
                        <FaRegComments className="mr-2 h-4 w-4" />
                        コメントを削除
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      選択されたタイプのコメントをテキストから全て削除します。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50">
              {caseConversionOptions.map((c) => (
                <TooltipProvider key={c.label} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={c.handler}
                          variant="outline"
                          className={`w-full ${c.color} transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center`}
                          disabled={!plainTextForCounts}
                        >
                          <FaSyncAlt className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">
                            {c.label}へ
                          </span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[180px] text-sm">
                      <p>
                        {c.label}ケースに変換します。
                        <br />
                        {c.tooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>
        </CardFooter>
      </Tabs>
    </Card>
  );
}
