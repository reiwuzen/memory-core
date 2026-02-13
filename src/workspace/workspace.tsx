import { useTab } from "@/hooks/useTab";
import "./workspace.scss";
import Settings from "./settings/settings";
import { useSettings } from "@/hooks/useSettings";
const Workspace = () => {
  const {tabDefaultComp, tabsData,activeTabId} =useTab();
  const {settingsView} = useSettings();
  const activeTab = tabsData.tabs.find((tab) => tab.id === activeTabId);
  const ActiveTabComponent = activeTab ? tabDefaultComp[activeTab.type] : null;
  return (
    <div className="workspace">
      {settingsView.isOpen.state && <Settings />}
      {ActiveTabComponent && <ActiveTabComponent />}
      {/* <Editor /> */}
    </div>
  );
};
export default Workspace;
