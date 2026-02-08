import { TabType } from "@/types/tab";
import Create from "@/workspace/create/create";
import MemorySpace from "@/workspace/memory_space/memory_space";
import Overview from "@/workspace/overview/overview";
import Settings from "@/workspace/settings/settings";
import Structure from "@/workspace/structure/structure";

export const TAB_COMPONENTS: Record<TabType, React.ComponentType> = {
  overview: Overview,
  memory_space: MemorySpace,
  create: Create,
  structure: Structure,
  settings: Settings,
  // editor: Editor,
};