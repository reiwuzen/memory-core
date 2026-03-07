import "./advancedSettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

const AdvancedSettings = () => {
  const {settingsData,settingsAction,} = useSettings();

  return (
    <div className="settings_section">

      <h3>Advanced</h3>

      {/* ===== PERFORMANCE ===== */}

      <div className="settings_group">
        <h4>Performance</h4>

        <label className="setting">
          <span>Enable performance mode</span>
          <input
            type="checkbox"
            checked={settingsData.performanceMode}
            onChange={settingsAction.performanceMode.toggle}
          />
        </label>

        <label className="setting">
          <span>Reduce animations</span>
          <input
            type="checkbox"
            checked={settingsData.reduceAnimations}
            onChange={settingsAction.reduceAnimations.toggle}
          />
        </label>

        <label className="setting">
          <span>Hardware acceleration</span>
          <input
            type="checkbox"
            checked={settingsData.hardwareAcceleration}
            onChange={settingsAction.hardwareAcceleration.toggle}
          />
        </label>

      </div>

      {/* ===== DEBUG ===== */}

      <div className="settings_group">
        <h4>Developer</h4>

        <label className="setting">
          <span>Enable debug logs</span>
          <input
            type="checkbox"
            checked={settingsData.debugLogs}
            onChange={()=>settingsAction.debugLogs.toggle()}
          />
        </label>

        <label className="setting">
          <span>Open logs folder</span>
          <button onClick={() => {
            toast.promise(settingsAction.storage.openFolder().then((res) => {
              if (!res.ok) throw new Error(res.error);
            }), {
              loading: "Opening logs/data folder...",
              success: "Opened logs/data folder",
              error: (err) => String(err),
            });
          }}>Open</button>
        </label>

      </div>

      {/* ===== DATA ===== */}

      <div className="settings_group">
        <h4>Data</h4>

        <label className="setting">
          <span>Export memory database</span>
          <button onClick={() => {
            toast.promise(settingsAction.exportData().then((res) => {
              if (!res.ok) throw new Error(res.error);
              return res.value;
            }), {
              loading: "Preparing export...",
              success: (fileName) => `Exported to ${fileName}`,
              error: (err) => String(err),
            });
          }}>Export</button>
        </label>

        <label className="setting">
          <span>Reset application settings</span>
          <button className="danger"
          onClick={()=>{
            settingsAction.reset()
            toast.success("Successfully reset settings to defaults")
          }}
          >Reset</button>
        </label>

      </div>

    </div>
  );
};

export default AdvancedSettings;
