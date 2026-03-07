import { useTab } from "@/hooks/useTab";
import "./workspace.scss";
import Settings from "./settings/settings";
import { useSettings } from "@/hooks/useSettings";
import Onboarding from "./onboarding/onboarding";
const Workspace = () => {
  const {tabDefaultComp, tabsData,activeTabId} =useTab();
  const {settingsView} = useSettings();
  const activeTab = tabsData.tabs.find((tab) => tab.id === activeTabId);
  const ActiveTabComponent = activeTab ? tabDefaultComp[activeTab.type] : null;
  return (
    <main className="workspace" aria-live="polite">
      <Onboarding />
      {settingsView.isOpen.state && <Settings />}
      {ActiveTabComponent && <ActiveTabComponent />}
      {/* <Editor /> */}
    </main>
  );
};
export default Workspace;
