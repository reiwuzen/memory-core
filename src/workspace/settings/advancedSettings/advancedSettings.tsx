import { useState } from "react";
import "./advancedSettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

const AdvancedSettings = () => {
  const {settingsData,settingsAction,} = useSettings();
  const [performanceMode, setPerformanceMode] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [hardwareAccel, setHardwareAccel] = useState(true);

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
            checked={performanceMode}
            onChange={()=>setPerformanceMode(!performanceMode)}
          />
        </label>

        <label className="setting">
          <span>Reduce animations</span>
          <input
            type="checkbox"
            checked={reduceAnimations}
            onChange={()=>setReduceAnimations(!reduceAnimations)}
          />
        </label>

        <label className="setting">
          <span>Hardware acceleration</span>
          <input
            type="checkbox"
            checked={hardwareAccel}
            onChange={()=>setHardwareAccel(!hardwareAccel)}
          />
        </label>

      </div>

      {/* ===== MEMORY ENGINE ===== */}

      <div className="settings_group">
        <h4>Memory Engine</h4>

        <label className="setting">
          <span>Rebuild memory index</span>
          <button>Rebuild</button>
        </label>

        <label className="setting">
          <span>Clear memory cache</span>
          <button>Clear</button>
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
          <button>Open</button>
        </label>

      </div>

      {/* ===== DATA ===== */}

      <div className="settings_group">
        <h4>Data</h4>

        <label className="setting">
          <span>Export memory database</span>
          <button>Export</button>
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
