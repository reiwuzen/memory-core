import "./memory_space.scss";
import MemorySpaceList from "./memory_spaces_list/memory_space_list";
import MemorySpaceItem from "./memory_space_item/memory_space_item";
import { MemoryNode } from "@/memory/schema";
import { invoke } from "@tauri-apps/api/core";
import { useActiveTab } from "@/hooks/useActiveTab";
// import { useEditorZen } from "@/editor/useEditorZen";
import Editor from "@/editor/editor";
import { useMemoryStore } from "@/store/useMemory.store";

const MemorySpace = () => {
  const { memory: selectedMemory, setMemory } = useMemoryStore();
  const { activeTab, setActiveTabView } = useActiveTab();
  if (!activeTab) return <p>Null</p>;
  // const {memory: editorMemory} = useEditorZen();

  return (
    <div className="memory-space">
      {activeTab.view === "list" && (
        <MemorySpaceList
          onSelect={async (memory) => {
            const memory_nodes = await invoke<MemoryNode[]>(
              "load_all_memory_nodes_of_memory_item",
              { memoryId: memory.item.memory_id },
            );

            setMemory({
              memoryItem: memory.item,
              activeNode: memory.active_node,
              nodes: memory_nodes,
            });
            setActiveTabView("detail");
            // setView("detail");
          }}
        />
      )}

      {activeTab.view === "detail" && selectedMemory && (
        <MemorySpaceItem
          memory={selectedMemory}
          // onBack={() => setView("list")}
        />
      )}
      {activeTab.view === "editor" && selectedMemory && <Editor />}
    </div>
  );
};

export default MemorySpace;
