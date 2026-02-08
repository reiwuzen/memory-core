import { useTab } from "@/hooks/useTab";
import "./workspace.scss";
const Workspace = () => {
  const {tabDefaultComp, tabsData,activeTabId} =useTab()
  const activeTab = tabsData.tabs.find((tab) => tab.id === activeTabId);
  const ActiveTabComponent = activeTab ? tabDefaultComp[activeTab.type] : null;
  return (
    <div className="workspace">
      {ActiveTabComponent && <ActiveTabComponent />}
      {/* <Editor /> */}
    </div>
  );
};
export default Workspace;
