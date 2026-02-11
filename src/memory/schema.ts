import { Tag } from "@/types/tag";

export type MemoryType = "Diary" | "Fact" | "Event" | "Schedule" | "Generic";
export type MemoryItem = {
  memory_id: string;
  created_at: string;
  title: string
  head_node_id: string

  last_updated_at:string
  last_opened_at: string
  // active_node_id: string;
  memory_type: MemoryType
  tags: Tag[]
};



export type MemoryNode = {
  node_id: string
  memory_id: string
  parent_node_id?: string
  created_at: string
  // content_string: string
  content_json: string
  // title: string
  change_reason?: string
}

