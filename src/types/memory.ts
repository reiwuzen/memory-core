import { MemoryItem, MemoryNode } from "@/memory/schema";

export type Memory = {
  memoryItem: MemoryItem;
  activeNode: MemoryNode;
  nodes?: MemoryNode[];
};