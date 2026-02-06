import { v7 } from "uuid";
import { MemoryItem, MemoryNode, MemoryType } from "@/memory/schema";
import { invoke } from "@tauri-apps/api/core";
export const MemoryItemService = () => {
  const createMemoryItem = async (title: string, type: MemoryType) => {
    const memory_id = v7();
    const initial_node_id = v7();
    const memoryItem: MemoryItem = {
      memory_id,
      created_at: new Date().toISOString(),
      active_node_id: initial_node_id,
    };
    const memoryNode: MemoryNode = {
      node_id: initial_node_id,
      title,
      memory_type: type,
      memory_id,
      created_at: new Date().toISOString(),
      content_json: "",
      tags: [],
    };
    await invoke("create_memory_item_with_initial_node", {
      memoryItem: memoryItem,
      memoryNode: memoryNode,
    });

    return { memoryItem, memoryNode };
  };
  const addNewNodeToExistingMemoryItem = async (
    memoryItem: MemoryItem,
    title: string,
    type: MemoryType,
    content_json: string,
  ) => {
    const new_node_id = v7();
    memoryItem.active_node_id = new_node_id;
    const memoryNode: MemoryNode = {
      memory_id: memoryItem.memory_id,
      node_id: new_node_id,
      title,
      created_at: new Date().toISOString(),
      content_json,
      // content_string,
      memory_type: type,
      tags: [],
    };
    await invoke("add_new_node_to_existing_memory_item", {
      memoryItem: memoryItem,
      memoryNode: memoryNode,
    });
    return { memoryItem, memoryNode };
  };
  const loadAllMemoryItems = async () => {
    const memoryItems: MemoryItem[] = await invoke("load_all_memory_items");
    const memoryItemsWithActiveNodes = await Promise.all(
      memoryItems.map(async (item) => {
        const active_node = await invoke<MemoryNode>(
          "load_active_memory_node_of_memory_item",
          { memoryItem: item },
        );
        //   console.log("found active node: ",active_node)
        return { item, active_node };
      }),
    );
    return memoryItemsWithActiveNodes;
  };
  const deleteMemoryItem = async (memoryId: string) => {
    try {
      await invoke("delete_memory_item", { memoryId });
      console.log("delete is called and tried")
      return { ok: true };
    } catch (err) {
        console.log("delete is called and cathced err", err)
      return {
        ok: false,
        error: String(err),
      };
    }
  };

  /**
   * sets  `node_id` as active node of `memory_id`
   * @param memory_id the memory_id whose active node id needed to be changed
   * @param node_id the node id which is to be set as active node id
   */
  const setActiveNodeIdOfMemoryItem = async (
    memory_id: string,
    node_id: string,
  ) => {
    await invoke("set_active_node_id_of_memory_item", {
      memoryId: memory_id,
      nodeId: node_id,
    });
  };
  return {
    createMemoryItem,
    addNewNodeToExistingMemoryItem,
    deleteMemoryItem,
    loadAllMemoryItems,
    setActiveNodeIdOfMemoryItem,
  };
};
