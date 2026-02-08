import { useTabStore } from "@/store/useTab.store";
import { TabType, TabView } from "@/types/tab";

export const useActiveTab = () => {
  const { activeTabId, tabs, switchTab } = useTabStore();

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  const setActiveTabView = (view: TabView<TabType>) => {
    if (!activeTab) return;
    switchTab(activeTab.id, activeTab.type, view);
  };

  const setActiveTabTypeAndView = <T extends TabType>(
    type: T,
    view: TabView<T>,
  ) => {
    if (!activeTab) return;
    switchTab(activeTab.id, type, view);
  };

  return {
    activeTab,
    hasActiveTab: !!activeTab, // convenience flag
    setActiveTabView, // always exists
    setActiveTabTypeAndView, // always exists
  };
};
