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
export type BlockMetaMap = {
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



export type EditorState = {
  /* ---------- STATE ---------- */
  blocks: Block[];
  setBlocks: (b:Block[]) => void
  editable: boolean
  setEditable: (v: boolean) =>void
  openMenu: OpenMenu;

  setOpenMenu: (menu: OpenMenu) => void;

  insertBlockAfter: <T extends BlockType>(
    afterId: string,
    type: T
  ) => string;

  replaceBlock: <T extends BlockType>(
    id: string,
    type: T
  ) => string;

  deleteBlock: (id: string) => string;

  updateBlockContent: <T extends BlockType>(
    id: string,
    content: Block<T>["content"]
  ) => void;

  updateBlockMeta: <T extends BlockType>(
    id: string,
    meta: Partial<Block<T>["meta"]>
  ) => void;

  onSave: () => { blocks: Block[] };
};
type OpenMenu = {
  blockId: string;
  mode: "add" | "more";
} | null;