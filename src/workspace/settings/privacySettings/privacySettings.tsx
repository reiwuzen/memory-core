import { useEffect, useState } from "react";
import "./privacySettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
const PrivacySettings = () => {
const {clearData , settingsData,settingsAction} = useSettings();
  const [storagePath, setStoragePath] = useState("Loading...");

  useEffect(() => {
    settingsAction.storage.getPath().then((res) => {
      if (res.ok) setStoragePath(res.value);
      else setStoragePath("Unavailable");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="settings_section">

      <h3>Privacy & Storage</h3>


      <div className="settings_group">
        <h4>Privacy</h4>

        <label className="setting">
          <span>Local-only mode</span>
          <input
            type="checkbox"
            checked={settingsData.localOnlyMode}
            onChange={()=>settingsAction.localMode.toggle()}
          />
        </label>

        <label className="setting">
          <span>Send anonymous usage analytics</span>
          <input
            type="checkbox"
            checked={settingsData.analytics}
            onChange={()=>settingsAction.analytics.toggle()}
            disabled={settingsData.localOnlyMode}
          />
        </label>

        <label className="setting">
          <span>Allow AI to analyze memories</span>
          <input
            type="checkbox"
            checked={settingsData.aiAnalysis}
            onChange={settingsAction.aiAnalysis.toggle}
            disabled={settingsData.localOnlyMode}
          />
        </label>
        {settingsData.localOnlyMode ? (
          <p className="setting-note">Local-only mode keeps analytics and AI analysis off.</p>
        ) : null}

      </div>


      <div className="settings_group">
        <h4>Storage</h4>

        <label className="setting">
          <span title={storagePath}>Memory storage location: {storagePath}</span>
          <button onClick={() => {
            toast.promise(settingsAction.storage.openFolder().then((res) => {
              if (!res.ok) throw new Error(res.error);
            }), {
              loading: "Opening data folder...",
              success: "Opened data folder",
              error: (err) => String(err),
            });
          }}>Open Folder</button>
        </label>

        <label className="setting">
          <span>Enable automatic backups</span>
          <input
            type="checkbox"
            checked={settingsData.autoBackup}
            onChange={settingsAction.autoBackup.toggle}
          />
        </label>

        <label className="setting">
          <span>Backup frequency</span>
          <select
            value={settingsData.backupFrequency}
            onChange={(e)=>settingsAction.backupFrequency.set(e.target.value as "daily" | "weekly" | "manual")}
            disabled={!settingsData.autoBackup}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual</option>
          </select>
        </label>

        <label className="setting">
          <span>Data</span>
          <button onClick={(e)=>{
            e.stopPropagation()
            toast.promise(clearData().then((res) => {
              if (!res.ok) throw new Error(res.error);
            }),{
              loading: 'Clearing Data...',
              success: 'Cleared Data',
              error: e => String(e)
            })
          }}>Clear Data</button>
        </label>
        


      </div>

    </div>
  );
};

export default PrivacySettings;
