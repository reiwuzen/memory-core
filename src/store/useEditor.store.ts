import { createBlock } from "@/helper/createBlock";
import { widenBlock } from "@/helper/widenBlock";
import { EditorState } from "@/types/editor";
import { create } from "zustand";

export const useEditorStore = create<EditorState>((set, get) => ({
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
/**
 * inserts blocks after a given id of give type
 * @param afterId the id after which block to be inserted
 * @param type type of block to be inserted
 * @returns 
 */
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
  /**
   * changes the type of block with given id
   * @param id id of block to modify
   * @param type type to be set to block
   * @returns id of block whose type was changed
   */
  replaceBlock: (id, type) => {
    const newBlock = widenBlock(createBlock(type));

    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? newBlock : b)),
    }));

    return newBlock.id;
  },
  /**
   * delete the block of given id
   * @param id id of block
   * @returns prev id than deleted block in blocks array
   */
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
  /**
   * updates the content of block of given id
   * @param id id of interested block
   * @param content content to update
   */
  updateBlockContent: (id, content) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, content } : b
      ),
    }));
  },
  /**
   * updates the meta of block of given id
   * @param id id of interested block
   * @param meta meta to update
   */
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
