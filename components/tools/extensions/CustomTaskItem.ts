import { Node, mergeAttributes } from "@tiptap/core";
import { wrappingInputRule } from "@tiptap/pm/inputrules";

export interface TaskItemOptions {
  nested: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    taskItem: {
      /**
       * Toggle a task item
       */
      toggleTaskList: () => ReturnType;
    };
  }
}

export const inputRegex = /^\s*(\[([( |x])?\])\s$/;

export const CustomTaskItem = Node.create<TaskItemOptions>({
  name: "taskItem",

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {},
    };
  },

  content() {
    return this.options.nested ? "paragraph block*" : "paragraph+";
  },

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute("data-checked") === "true",
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        "data-checked": node.attrs.checked,
      }),
      [
        "label",
        {
          contenteditable: "false",
        },
        [
          "input",
          {
            type: "checkbox",
            checked: node.attrs.checked ? "checked" : null,
          },
        ],
        ["span"],
      ],
      ["div", 0],
    ];
  },

  addKeyboardShortcuts() {
    const shortcuts = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
    };

    if (!this.options.nested) {
      return shortcuts;
    }

    return {
      ...shortcuts,
      Tab: () => this.editor.commands.sinkListItem(this.name),
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement("li");
      const checkboxWrapper = document.createElement("label");
      const checkboxInput = document.createElement("input");
      const checkboxContent = document.createElement("span");
      const content = document.createElement("div");

      // Set up list item
      Object.entries(
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          "data-type": this.name,
          "data-checked": node.attrs.checked,
        })
      ).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });

      // Set up checkbox wrapper
      checkboxWrapper.contentEditable = "false";
      checkboxWrapper.appendChild(checkboxInput);
      checkboxWrapper.appendChild(checkboxContent);

      // Set up checkbox input
      checkboxInput.type = "checkbox";
      checkboxInput.checked = node.attrs.checked;

      // Add click event to checkbox
      checkboxInput.addEventListener("change", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (typeof getPos === "function") {
          const pos = getPos();
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              const nodePos = pos;
              tr.setNodeMarkup(nodePos, undefined, {
                ...node.attrs,
                checked: checkboxInput.checked,
              });
              return true;
            })
            .run();
        }
      });

      // Add click event to label to toggle checkbox
      checkboxWrapper.addEventListener("click", (event) => {
        if (event.target !== checkboxInput) {
          event.preventDefault();
          event.stopPropagation();
          checkboxInput.click();
        }
      });

      // Set up content container
      content.style.outline = "none";

      // Build structure
      listItem.appendChild(checkboxWrapper);
      listItem.appendChild(content);

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          // Update checkbox state
          checkboxInput.checked = updatedNode.attrs.checked;
          listItem.setAttribute("data-checked", updatedNode.attrs.checked);

          return true;
        },
      };
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => ({
          checked: match[match.length - 1] === "x",
        }),
      }),
    ];
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) => {
          return commands.toggleList(this.name, "taskList");
        },
    };
  },
});
