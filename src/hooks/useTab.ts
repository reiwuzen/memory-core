import { TAB_COMPONENTS } from "@/constants/tab";
import { useTabStore } from "@/store/useTab.store";
export const useTab = () => {
  const { tabs, activeTabId, setActiveTabId, switchTab } = useTabStore();
  const tabsData = {
    tabs,
  };
  const tabActions = {
    setActiveTab: setActiveTabId,
    switch: switchTab,
  };
  return {
    tabsData,
    activeTabId,
    tabActions,
    tabDefaultComp: TAB_COMPONENTS,
  };
};
