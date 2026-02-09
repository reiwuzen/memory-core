import { MemoryItem, MemoryNode } from "@/memory/schema";

export type Memory = {
  memory_item: MemoryItem;
  active_node: MemoryNode;
  nodes: MemoryNode[];
};