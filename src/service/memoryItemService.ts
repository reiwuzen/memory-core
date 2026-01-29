import { v7 } from "uuid";
import { MemoryItem, MemoryNode, MemoryType } from "@/memory/schema";
import { MemoryNodeService } from "./memoryNodeService";
import { invoke } from "@tauri-apps/api/core";
export const MemoryItemService = () => {
    const {createMemoryNode, loadMemoryNode } = MemoryNodeService();
    const createMemoryItem = (title: string, type:MemoryType) => {
        const newMemoryItem: MemoryItem = {
            memory_id: v7(),
            created_at: new Date().toISOString(),
            active_node_id: "",
        }
        const memoryNode = createMemoryNode(newMemoryItem.memory_id, title, type,{},"Initial creation", undefined);
        const memoryItem: MemoryItem = {
            ...newMemoryItem,
            active_node_id: memoryNode.node_id,
        }
        return {memoryItem, memoryNode};
    }
    const loadAllMemoryItems = async (
        
    ) => {
        const memoryItems: MemoryItem[] = await invoke("load_all_memory_items");
        const memoryItemsWithActiveNodes = await Promise.all(memoryItems.map(async(item)=> {
            if (!item.active_node_id) {
        return { item, active_node: null };
      }
      const active_node = await invoke<MemoryNode>("load_active_memory_node_of_memory_item", { memoryItem: item})
      return {item, active_node}
        }))
        return memoryItemsWithActiveNodes;
    }
    const deleteMemoryItem = () => {
        return
    }
    return { createMemoryItem, deleteMemoryItem, loadAllMemoryItems };
}