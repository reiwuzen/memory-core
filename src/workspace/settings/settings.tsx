import GeneralSettings from "./generalSettings/generalSettings";
import IntelligenceSettings from "./intelligenceSettings/intelligentSettings";
import MemorySettings from "./memorySettings/memorySettings";
import AdvancedSettings from "./advancedSettings/advancedSettings";
import PrivacySettings from "./privacySettings/privacySettings";
import "./settings.scss";
import { useSettings } from "@/hooks/useSettings";

const Settings = () => {
  const { settingsView } = useSettings();
  return (
    <>
      {settingsView.isOpen.state && (
        <div
          className="settings__backdrop"
          onClick={() => settingsView.isOpen.actions.disable()}
        ></div>
      )}
      <div className="settings">
         <div className="settings__container">

        <aside className="settings__sidebar">
          <h2 className="settings__title">Settings</h2>

          <nav>
            <button
              onClick={() => settingsView.view.actions.general()}
              className={settingsView.view.state === "general" ? "active" : ""}
            >
              General
            </button>
            <button
              onClick={() => settingsView.view.actions.memory()}
              className={settingsView.view.state === "memory" ? "active" : ""}
            >
              Memory
            </button>
            <button
              onClick={() => settingsView.view.actions.privacy()}
              className={settingsView.view.state === "privacy" ? "active" : ""}
            >
              Privacy & Storage
            </button>
            <button
              onClick={() => settingsView.view.actions.intelligence()}
              className={
                settingsView.view.state === "intelligence" ? "active" : ""
              }
            >
              Intelligence
            </button>
            <button
              onClick={() => settingsView.view.actions.advanced()}
              className={settingsView.view.state === "advanced" ? "active" : ""}
              >
              Advanced
            </button>
          </nav>
        </aside>

        <section className="settings__panel">
          {settingsView.view.state === "general" && <GeneralSettings />}
          {settingsView.view.state === "memory" && <MemorySettings />}
          {settingsView.view.state === "privacy" && <PrivacySettings />}
          {settingsView.view.state === "intelligence" && (
            <IntelligenceSettings />
          )}
          {settingsView.view.state === "advanced" && <AdvancedSettings />}
        </section>
          </div>
      </div>
    </>
  );
};

export default Settings;
