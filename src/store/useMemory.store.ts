import { MemoryItem, MemoryNode } from "@/memory/schema";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { Memory } from "@/types/memory";

type MemoryStore = {
  memory: Memory | null;
  setMemory: (m: Partial<Memory>) => void;
  resetMemory: ()=> void
  reloadMemory: (memoryId: string) => Promise<Memory>;
};

export const useMemoryStore = create<MemoryStore>((set) => ({
  memory: null,
  setMemory: (m) =>
    set((s)=>({
      memory: {...s.memory, ...m} as Memory,
    })),
    /**
     * resets memory from memory store
     * @returns void
     */
    resetMemory: () => set({
      memory: null
    }),

    /**
     * reloads Memory of given memory Id
     * @param memoryId 
     * @returns `memory`
     */
  reloadMemory: async (memoryId) => {
    const { memory_item: memoryItem, active_node:activeNode, nodes } =
  await invoke<{
    memory_item: MemoryItem;
    active_node: MemoryNode;
    nodes: MemoryNode[];
  }>("get_memory_item_active_node_nodes", { memoryId });

set({
  memory: {
    memoryItem: memoryItem,
    activeNode: activeNode,
    nodes,
  },
});
    return { memoryItem, activeNode, nodes };
  },
}));
