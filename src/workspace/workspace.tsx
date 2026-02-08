import { useTabStore } from "@/store/useTab.store";
import "./workspace.scss";
import { TAB_COMPONENTS } from "@/types/tab";
const Workspace = () => {
  const { activeTabId, tabs } = useTabStore();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const ActiveTabComponent = activeTab ? TAB_COMPONENTS[activeTab.type] : null;
  return (
    <div className="workspace">
      {ActiveTabComponent && <ActiveTabComponent />}
      {/* <Editor /> */}
    </div>
  );
};
export default Workspace;
