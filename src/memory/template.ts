// memory/templates.ts
import type { MemoryType } from "@/memory/schema";

export type MemoryTemplate = {
  id: string;
  label: string;
  description: string;
  memoryType: MemoryType;
  initialTitle: string;
  initialContent?: string;
};

export const MEMORY_TEMPLATES: MemoryTemplate[] = [
  {
    id: "generic",
    label:"Generic",
    description:"Create a custom",
    memoryType: "Generic",
    initialTitle:"",
    initialContent:""
  },
  {
    id: "daily-diary",
    label: "Daily Diary",
    description: "Reflect on your day",
    memoryType: "Diary",
    initialTitle: "Diary — ",
    initialContent: "<p>Today I felt...</p>",
  },
  {
    id: "fact-note",
    label: "Fact Note",
    description: "Store objective information",
    memoryType: "Fact",
    initialTitle: "Fact — ",
    initialContent: "<p>Fact:</p>",
  },
  {
    id: "event-log",
    label: "Event",
    description: "Record something that happened",
    memoryType: "Event",
    initialTitle: "Event — ",
  },
];
