import { useState } from "react";
import "./privacySettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettings.store";
const PrivacySettings = () => {
const {clearData} = useSettings();
const {localOnlyMode,setLocalOnlyMode} =useSettingsStore()
  // const [localOnly, setLocalOnly] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [aiAccess, setAiAccess] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("Daily");

  return (
    <div className="settings_section">

      <h3>Privacy & Storage</h3>


      <div className="settings_group">
        <h4>Privacy</h4>

        <label className="setting">
          <span>Local-only mode</span>
          <input
            type="checkbox"
            checked={localOnlyMode}
            onChange={()=>setLocalOnlyMode(!!!localOnlyMode)}
          />
        </label>

        <label className="setting">
          <span>Send anonymous usage analytics</span>
          <input
            type="checkbox"
            checked={analytics}
            onChange={()=>setAnalytics(!analytics)}
          />
        </label>

        <label className="setting">
          <span>Allow AI to analyze memories</span>
          <input
            type="checkbox"
            checked={aiAccess}
            onChange={()=>setAiAccess(!aiAccess)}
          />
        </label>

      </div>


      <div className="settings_group">
        <h4>Storage</h4>

        <label className="setting">
          <span>Memory storage location</span>
          <button>Change Folder</button>
        </label>

        <label className="setting">
          <span>Enable automatic backups</span>
          <input
            type="checkbox"
            checked={autoBackup}
            onChange={()=>setAutoBackup(!autoBackup)}
          />
        </label>

        <label className="setting">
          <span>Backup frequency</span>
          <select
            value={backupFrequency}
            onChange={(e)=>setBackupFrequency(e.target.value)}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Manual</option>
          </select>
        </label>

        <label className="setting">
          <span>Cache</span>
          <button>Clear Cache</button>
        </label>

        <label className="setting">
          <span>Data</span>
          <button onClick={(e)=>{
            e.stopPropagation()
            toast.promise(clearData(),{
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
