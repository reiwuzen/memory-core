export type BlockType = keyof BlockMetaMap & keyof BlockContentMap;

export type InlineNode =
  | {
      type: "text";
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      highlight?: boolean;
    }
  | {
      type: "link";
      href: string;
      children: InlineNode[];
    }
  | {
      type: "inline-code";
      text: string;
    }
  | {
      type: "inline-equation";
      latex: string;
    };

// export type InlineCapable = Exclude<BlockType, "equation"|'code'>;

export type BlockContentMap = {
  paragraph: InlineNode[];
  heading1: InlineNode[];
  heading2: InlineNode[];
  heading3: InlineNode[];
  quote: InlineNode[];
  callout: InlineNode[];
  toggle: InlineNode[];
  "list-item": InlineNode[];
  code: { text: string };
  equation: { latex: string };
};

export type AnyBlock = {
  [K in BlockType]: Block<K>;
}[BlockType];

export type Block<T extends BlockType = BlockType> = {
  id: string;
  type: T;
  meta: BlockMetaMap[T];
  content: BlockContentMap[T];
};
type BlockMetaMap = {
  paragraph: object;
  heading1: { level: 1 };
  heading2: { level: 2 };
  heading3: { level: 3 };
  quote: object;
  callout: { icon?: string };
  toggle: { collapsed: boolean };
  "list-item": {
    style: "bullet" | "number" | "todo";
    checked?: boolean;
    depth: number;
  };
  code: { language?: string };
  equation: object;
};

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
