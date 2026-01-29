import { v7 } from "uuid";
import { MemoryNode, MemoryType } from "@/memory/schema";
import { invoke } from "@tauri-apps/api/core";
export const MemoryNodeService = () => {
  const createMemoryNode = (
    memory_id: string,
    title: string,
    memory_type: MemoryType,
    content: unknown,
    comment: string,
    parent_node_id?: string,
  ) => {
    const newMemoryNode: MemoryNode = {
      node_id: v7(),
      memory_id,
      parent_node_id,
      title,
      memory_type,
      content: JSON.stringify(content),
      created_at: new Date().toISOString(),
      change_reason: comment,
    };
    return newMemoryNode;
  };
  const loadMemoryNode = async (memory_id: string) => {
    await invoke("load_memory_node", { memory_id });
    
    return;
  }
  return {
    createMemoryNode,
    loadMemoryNode
    // appendMemoryNode,
  };
};
