import { Node, mergeAttributes } from "@tiptap/core";

export interface CodeBlockWithLanguageLabelOptions {
  languageClassPrefix: string;
  HTMLAttributes: Record<string, unknown>;
  defaultLanguage: string | null | undefined;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeBlockWithLanguageLabel: {
      setCodeBlock: (attributes?: { language: string }) => ReturnType;
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
    };
  }
}

export const CodeBlockWithLanguageLabel =
  Node.create<CodeBlockWithLanguageLabelOptions>({
    name: "codeBlockWithLanguageLabel",

    addOptions() {
      return {
        languageClassPrefix: "language-",
        HTMLAttributes: {},
        defaultLanguage: null,
      };
    },

    content: "text*",

    marks: "",

    group: "block",

    code: true,

    defining: true,

    addAttributes() {
      return {
        language: {
          default: this.options.defaultLanguage,
          parseHTML: (element) => {
            const classAttribute = element.getAttribute("class") || "";
            const languages = classAttribute
              .split(" ")
              .filter((item) =>
                item.startsWith(this.options.languageClassPrefix)
              )
              .map((item) =>
                item.replace(this.options.languageClassPrefix, "")
              );

            return languages.length > 0
              ? languages[0]
              : this.options.defaultLanguage;
          },
          rendered: false,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "pre",
          preserveWhitespace: "full",
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      const language = node.attrs.language;
      const languageClass = language
        ? `${this.options.languageClassPrefix}${language}`
        : "";

      return [
        "pre",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          "data-language": language || "text",
          class: `hljs ${languageClass}`.trim(),
        }),
        ["code", { class: `language-${language || "text"}` }, 0],
      ];
    },

    addCommands() {
      return {
        setCodeBlock:
          (attributes) =>
          ({ commands }) => {
            return commands.setNode(this.name, attributes);
          },
        toggleCodeBlock:
          (attributes) =>
          ({ commands }) => {
            return commands.toggleNode(this.name, "paragraph", attributes);
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
      };
    },
  });

export default CodeBlockWithLanguageLabel;
