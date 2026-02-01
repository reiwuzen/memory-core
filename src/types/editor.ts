export type BlockType =
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "page"
  | "page-in"
  | "bullet-list"
  | "number-list"
  | "todo"
  | "toggle"
  | "code"
  | "quote"
  | "callout"
  | "equation";

export type Item = {
  type: BlockType;
  label: string;
  icon: string;
  hint?: string;
  disabled?: boolean;
};

export const BLOCK_ITEMS: Item[] = [
  {
    type: "text",
    label: "Text",
    icon: "T",
    hint: "Just start typing",
  },
  {
    type: "heading1",
    label: "Heading 1",
    icon: "H1",
    hint: "# + ",
  },
  {
    type: "heading2",
    label: "Heading 2",
    icon: "H2",
    hint: "## + ",
  },
  {
    type: "heading3",
    label: "Heading 3",
    icon: "H3",
    hint: "### + ",
  },
  {
    type: "page",
    label: "Page",
    icon: "📄",
  },
  {
    type: "page-in",
    label: "Page in",
    icon: "↪",
  },
  {
    type: "bullet-list",
    label: "Bulleted list",
    icon: "•–",
    hint: "- + ",
  },
  {
    type: "number-list",
    label: "Numbered list",
    icon: "1–",
    hint: "1. + ",
  },
  {
    type: "todo",
    label: "To-do list",
    icon: "☑",
    hint: "[] + ",
  },
  {
    type: "toggle",
    label: "Toggle list",
    icon: "▶",
    hint: "> + ",
  },
  {
    type: "code",
    label: "Code",
    icon: "</>",
    hint: "```",
  },
  {
    type: "quote",
    label: "Quote",
    icon: "❝",
    hint: '" + ',
  },
  {
    type: "callout",
    label: "Callout",
    icon: "ⓘ",
  },
  {
    type: "equation",
    label: "Block equation",
    icon: "∑",
    disabled: true,
  },
];
