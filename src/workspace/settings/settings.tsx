import GeneralSettings from "./generalSettings/generalSettings";
import IntelligenceSettings from "./intelligenceSettings/intelligentSettings";
import MemorySettings from "./memorySettings/memorySettings";
import AdvancedSettings from "./advancedSettings/advancedSettings";
import PrivacySettings from "./privacySettings/privacySettings";
import "./settings.scss";
// import { useState } from "react";
import { useActiveTab } from "@/hooks/useActiveTab";



const Settings = () => {
  const {activeTab, setActiveTabTypeAndView} = useActiveTab();
  // const [active, setActive] = useState<SettingsSection>("general");
  if(!activeTab) return
  return (
    <div className="settings">
      <aside className="settings__sidebar">
        <h2 className="settings__title">Settings</h2>

        <nav>
          <button onClick={() =>setActiveTabTypeAndView('settings','general')} className={activeTab.view === "general" ? "active" : ""}>
            General
          </button>
          <button onClick={() => setActiveTabTypeAndView('settings','memory')} className={activeTab.view === "memory" ? "active" : ""}>
            Memory
          </button>
          <button onClick={() => setActiveTabTypeAndView('settings','privacy')} className={activeTab.view === "privacy" ? "active" : ""}>
            Privacy & Storage
          </button>
          <button onClick={() => setActiveTabTypeAndView('settings','intelligence')} className={activeTab.view === "intelligence" ? "active" : ""}>
            Intelligence
          </button>
          <button onClick={() => setActiveTabTypeAndView('settings','advanced')} className={activeTab.view === "advanced" ? "active" : ""}>
            Advanced
          </button>
        </nav>
      </aside>

      <section className="settings__panel">
        {activeTab.view === "general" && <GeneralSettings />}
        {activeTab.view === "memory" && <MemorySettings />}
        {activeTab.view === "privacy" && <PrivacySettings />}
        {activeTab.view === "intelligence" && <IntelligenceSettings />}
        {activeTab.view === "advanced" && <AdvancedSettings />}
      </section>
    </div>
  );
};

export default Settings;
