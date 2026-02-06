import { create } from "zustand";
import { BlockType } from "@/types/editor";
import { Block } from "@/types/editor";
import { convertToMD } from "@/helper/convertToMD";
import { MemoryItem, MemoryNode } from "@/memory/schema";

type OpenMenu = {
  blockId: string;
  type: "add" | "more";
} | null;



type EditorState = {
  /* ---------- STATE ---------- */
  blocks: Block[];
  openMenu: OpenMenu;
  



  /* ---------- UI ---------- */
  setOpenMenu: (menu: OpenMenu) => void;
  onClickBlockMenuItem: (block: Block, changeToType: BlockType) => string;

  /* ---------- BLOCK ACTIONS ---------- */
  insertBlockAfter: (afterId: string, type: BlockType) => string;
  changeBlockType: (id: string, type: BlockType) => string;
  deleteBlock: (id: string) => string;
  updateBlockContent: (id: string, content: string) => string;
  onSave: (blocks: Block[]) => {blocks: Block[], content:string};
};

export const useEditorZen = create<EditorState>((set, get) => ({
  /* ---------- INITIAL STATE ---------- */
  blocks: [
    {
      id: crypto.randomUUID(),
      content: "",
      type: 'text',
    },
  ],
  openMenu: null,

 onClickBlockMenuItem: (block, changeToType) => {
    let returnId: string;
    block.content === ""
      ? (returnId = get().changeBlockType(block.id, changeToType))
      : (returnId = get().insertBlockAfter(block.id, changeToType));

    get().setOpenMenu(null);
    return returnId;
  },

  /* ---------- UI ---------- */
  setOpenMenu: (openMenu) => set({ openMenu }),

  /* ---------- BLOCK ACTIONS ---------- */

  insertBlockAfter: (afterId, type) => {
  const newId = crypto.randomUUID();

  const nextType =
    type === "heading1" ||
    type === "heading2" ||
    type === "heading3"
      ? "text"
      : type;

  set((state) => {
    const index = state.blocks.findIndex((b) => b.id === afterId);
    if (index === -1) return state;

    const next = [...state.blocks];
    next.splice(index + 1, 0, {
      id: newId,
      content: "",
      type: nextType,
    });

    return { blocks: next };
  });

  return newId;
},

  changeBlockType: (id, type) => {
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, type } : b)),
    }));
    return id;
  },

  deleteBlock: (id: string): string => {
    const { blocks } = get();

    if (blocks.length === 1) return "";

    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return "";

    const prevId =
      index > 0 ? blocks[index - 1].id : (blocks[index + 1]?.id ?? "");

    set({
      blocks: blocks.filter((b) => b.id !== id),
    });

    return prevId as string;
  },

  updateBlockContent: (id, content) => {
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
    }));
    return id;
  },
  onSave: (blocks) => {
    // const content_json = blocks
  const content = blocks
    .map((block, i) => convertToMD(block, i))
    .join("\n\n");
    return{
      blocks,
      content,
    }
  // persist content somewhere
}
}));
