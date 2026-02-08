import { create } from "zustand";
import type {  Block, BlockType } from "@/types/editor";
import { createBlock } from "@/helper/createBlock";
import { widenBlock } from "@/helper/widenBlock";


type OpenMenu = {
  blockId: string;
  mode: "add" | "more";
} | null;

type EditorState = {
  /* ---------- STATE ---------- */
  blocks: Block[];
  setBlocks: (b:Block[]) => void
  editable: boolean
  setEditable: (v: boolean) =>void
  openMenu: OpenMenu;

  /* ---------- UI ---------- */
  setOpenMenu: (menu: OpenMenu) => void;

  /* ---------- BLOCK OPS ---------- */
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



export const useEditorZen = create<EditorState>((set, get) => ({
  /* ---------- INITIAL STATE ---------- */
  blocks: [createBlock("paragraph")],
  setBlocks: (b)=>set({
    blocks:b
  }),
  editable: false,
  setEditable: (v)=> set({editable:v}),

  openMenu: null,

  /* ---------- UI ---------- */
  setOpenMenu: (openMenu) => set({ openMenu }),

  /* ---------- BLOCK OPS ---------- */

  insertBlockAfter: (afterId, type) => {
    
    const newBlock = widenBlock(createBlock(type))

    set((state) => {
      const index = state.blocks.findIndex((b) => b.id === afterId);
      if (index === -1) return state;

      const blocks = [...state.blocks];
      blocks.splice(index + 1, 0, newBlock);
      return { blocks };
    });

    return newBlock.id;
  },

  replaceBlock: (id, type) => {
    const newBlock = widenBlock(createBlock(type));

    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? newBlock : b)),
    }));

    return newBlock.id;
  },

  deleteBlock: (id) => {
    const { blocks } = get();
    if (blocks.length === 1) return "";

    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return "";

    const focusId =
      index > 0 ? blocks[index - 1].id : blocks[index + 1]?.id ?? "";

    set({ blocks: blocks.filter((b) => b.id !== id) });
    return focusId;
  },

  updateBlockContent: (id, content) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, content } : b
      ),
    }));
  },

  updateBlockMeta: (id, meta) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id
          ? { ...b, meta: { ...b.meta, ...meta } }
          : b
      ),
    }));
  },

  onSave: () => ({ blocks: get().blocks }),
}));
