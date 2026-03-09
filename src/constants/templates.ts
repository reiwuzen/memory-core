import { PageTemplate } from "@/types/template";

export const PAGES_TEMPLATES: PageTemplate[] = [
  {
    id: "generic",
    label: "Generic",
    description: "Create a custom",
    pageType: "generic",
    initialTitle: "",
    initialContent: ""
  },
  {
    id: "daily-diary",
    label: "Daily Diary",
    description: "Reflect on your day",
    pageType: "diary",
    initialTitle: "Diary - ",
    initialContent: "<p>Today I felt...</p>",
  },
  {
    id: "fact-note",
    label: "Fact Note",
    description: "Store objective information",
    pageType: "fact",
    initialTitle: "Fact - ",
    initialContent: "<p>Fact:</p>",
  },
  {
    id: "event-log",
    label: "Event",
    description: "Record something that happened",
    pageType: "event",
    initialTitle: "Event - ",
  },
];
