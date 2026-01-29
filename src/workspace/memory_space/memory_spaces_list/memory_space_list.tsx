import { MemoryItemService } from "@/service/memoryItemService";
import "./memory_space_list.scss"
import { MemoryItem, MemoryNode } from "@/memory/schema";
import { useEffect, useState } from "react";
type MemoryItemWithActiveNode = {
  item: MemoryItem;
  active_node: MemoryNode | null;
};
type memorySpaceListProps = {
    onSelect: (memory: MemoryItemWithActiveNode) => void;
}
const MemorySpaceList = ({ onSelect }: memorySpaceListProps) => {
    const { loadAllMemoryItems } = MemoryItemService();
    
      const [memoryItems, setMemoryItems] = useState<
        MemoryItemWithActiveNode[]
      >([]);
    
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
    
      useEffect(() => {
        const fetchMemoryItems = async () => {
          try {
            const data = await loadAllMemoryItems();
            setMemoryItems(data);
          } catch (err) {
            setError(String(err));
          } finally {
            setLoading(false);
          }
        };
    
        fetchMemoryItems();
      }, [loadAllMemoryItems]);
    
      if (loading) {
        return <div className="memory-space-list">Loading…</div>;
      }
    
      if (error) {
        return <div className="memory-space-list error">{error}</div>;
      }
    
      return (
       <div className="memory-space-list">
          <h1>Memory Space</h1>
    
          <div className="memory-space-list-items">
            {memoryItems.map(({ item, active_node }) => (
                <div key={item.memory_id} className="memory-space-list-item"
                onClick={() => onSelect({item, active_node})}
                >
                <h2>{active_node?.title}</h2>
    
                {/* {active_node && (
                    <p className="memory-space-list-preview">
                    {active_node.content?.slice(0, 120)}
                  </p>
                )} */}
              </div>
            ))}
          </div>
        </div>
      );
}
export default MemorySpaceList