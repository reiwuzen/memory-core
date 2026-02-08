import { BlockContentMap, BlockMetaMap, BlockType } from "@/types/editor";

export const BLOCK_DEFAULT_CONTENT: {
  [K in BlockType]: BlockContentMap[K];
} = {
  paragraph: [],
  heading1: [],
  heading2: [],
  heading3: [],
  quote: [],
  callout: [],
  toggle: [],
  "list-item": [],
  code: {
    text: "",
  },
  equation: {
    latex: "",
  },
};

export const BLOCK_ITEMS: {
  type:
    | Exclude<BlockType, "list-item">
    | "bullet-list"
    | "number-list"
    | "todo";
  icon: string;
  label: string;
  hint?: string;
}[] = [
  {
    type: "paragraph",
    icon: "T",
    label: "Text",
    hint: "Just start writing",
  },
  {
    type: "heading1",
    icon: "H1",
    label: "Heading 1",
    hint: "#",
  },
  {
    type: "heading2",
    icon: "H2",
    label: "Heading 2",
    hint: "##",
  },
  {
    type: "heading3",
    icon: "H3",
    label: "Heading 3",
    hint: "###",
  },
  {
    type: "quote",
    icon: "❝",
    label: "Quote",
    hint: "''",
  },
  {
    type: "callout",
    icon: "💡",
    label: "Callout",
  },
  {
    type: "toggle",
    icon: "▸",
    label: "Toggle",
  },
  {
    type: "bullet-list",
    icon: "•",
    label: "Bullet-list",
    hint: "-",
  },
  {
    type: "number-list",
    icon: "1.",
    label: "Number-list",
    hint: "1.",
  },
  { type: "todo", icon: "[]", label: "TODO", hint: "[]" },
  {
    type: "code",
    icon: "</>",
    label: "Code",
    hint: "Write or paste code",
  },
  {
    type: "equation",
    icon: "∑",
    label: "Equation",
    hint: "LaTeX math block",
  },
];

export const BLOCK_DEFAULT_META: {
  [K in BlockType]: BlockMetaMap[K];
} = {
  paragraph: {},
  heading1: { level: 1 },
  heading2: { level: 2 },
  heading3: { level: 3 },
  quote: {},
  callout: {},
  toggle: { collapsed: false },
  "list-item": {
    style: "bullet",
    depth: 0,
  },
  code: {},
  equation: {},
};



