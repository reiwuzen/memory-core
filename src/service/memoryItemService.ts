import { v7 } from "uuid";
import { MemoryItem, MemoryNode, MemoryType } from "@/memory/schema";
import { MemoryNodeService } from "./memoryNodeService";
import { invoke } from "@tauri-apps/api/core";
export const MemoryItemService = () => {
    const {createMemoryNode,
        //  loadMemoryNode 
         } = MemoryNodeService();
    const createMemoryItem = async (title: string, type:MemoryType) => {
        const memory_id = v7();
        const initial_node_id = v7();
        const memoryItem:MemoryItem ={
            memory_id,
            created_at: new Date().toISOString(),
active_node_id: initial_node_id
        } 
        const memoryNode: MemoryNode = {
            node_id: initial_node_id,
            title,
            memory_type:type,
            memory_id,
            created_at: new Date().toISOString(),
            content_json: '',
            content_string: '',
        }
        await invoke("create_memory_item",{
            memoryItem:memoryItem,
            memoryNode:memoryNode,
        })
                
                
        return {memoryItem, memoryNode};
    }
    const loadAllMemoryItems = async (
        
    ) => {
        const memoryItems: MemoryItem[] = await invoke("load_all_memory_items");
        const memoryItemsWithActiveNodes = await Promise.all(memoryItems.map(async(item)=> {
            if (!item.active_node_id) {
                console.log("no active node")
        return { item, active_node: null };
      }
      const active_node = await invoke<MemoryNode>("load_active_memory_node_of_memory_item", { memoryItem: item})
      console.log("found active node: ",active_node)
      return {item, active_node}
        }))
        return memoryItemsWithActiveNodes;
    }
    const deleteMemoryItem = () => {
        return
    }

    /**
     * sets  `node_id` as active node of `memory_id`
     * @param memory_id the memory_id whose active node id needed to be changed
     * @param node_id the node id which is to be set as active node id
     */
    const setActiveNodeIdOfMemoryItem = async (memory_id: string, node_id: string) => {

       await invoke("set_active_node_id_of_memory_item", {memoryId: memory_id, nodeId: node_id})
    }
    return { createMemoryItem, deleteMemoryItem, loadAllMemoryItems, setActiveNodeIdOfMemoryItem };
}