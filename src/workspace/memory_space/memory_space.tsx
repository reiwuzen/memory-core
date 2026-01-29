import "./memory_space.scss";
import { useState } from "react";
import MemorySpaceList from "./memory_spaces_list/memory_space_list";
import MemorySpaceItem from "./memory_space_item/memory_space_item";
import { MemoryNode, selectedMemoryType } from "@/memory/schema";
import { invoke } from "@tauri-apps/api/core";

type ViewState = "list" | "detail";

const MemorySpace = () => {
  const [view, setView] = useState<ViewState>("list");
  const [selectedMemory, setSelectedMemory] =
    useState<selectedMemoryType | null>(null);

  return (
    <div className="memory-space">

      {view === "list" && (
        <MemorySpaceList
          onSelect={async (memory) => {
            const memory_nodes = await invoke<MemoryNode[]>("load_all_memory_nodes_of_memory_item", {memoryId: memory.item.memory_id});
            const selectMemory: selectedMemoryType = {
              memory_item: memory.item,
              active_node: memory.active_node!,
              nodes: memory_nodes
            }
            setSelectedMemory(selectMemory);
            setView("detail");
          }}
        />
      )}

      {view === "detail" && selectedMemory && (
        <MemorySpaceItem
          memory={selectedMemory}
          // onBack={() => setView("list")}
        />
      )}

    </div>
  );
};

export default MemorySpace;
