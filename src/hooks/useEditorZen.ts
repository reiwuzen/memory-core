import { useEditorStore } from "@/store/useEditor.store"
export const useEditorZen = () => {
  const {
    blocks,
    setBlocks,
    replaceBlock,
    insertBlockAfter,
    openMenu,
    setOpenMenu,
    setEditable,
    editable,
    deleteBlock,
    updateBlockContent,
    updateBlockMeta
  } = useEditorStore();

  const updateBlock = {
    content: updateBlockContent,
    meta: updateBlockMeta
  };
  const openMenuActions ={
    setToNull:()=> setOpenMenu(null),
    set: setOpenMenu
  }

  const editableActions = {
    enable: () => setEditable(true),
    disable: () => setEditable(false),
    toggle: () => setEditable(!editable)
  };

  const blockActions = {
    setToNull: () => setBlocks(null),
    set: setBlocks,
    changeType: replaceBlock,
    insertBlockAfter,
    delete: deleteBlock
  };

  return {
    blocks,
    editable,
    openMenu,
    openMenuActions,
    updateBlock,
    editableActions,
    blockActions
  };
};
