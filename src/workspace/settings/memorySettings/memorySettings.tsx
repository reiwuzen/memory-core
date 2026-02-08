import { useState } from "react";
import "./memorySettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { MemoryView } from "@/types/settings";
const MemorySettings = () => {
  const { settingsData, settingsAction } = useSettings();
  const [autoCreateNode, setAutoCreateNode] = useState(true);
  const [autoLink, setAutoLink] = useState(true);
  const [autoTag, setAutoTag] = useState(false);
  const [versionLevel, setVersionLevel] = useState("Standard");
  const [timelineGroup, setTimelineGroup] = useState("Day");
  const [showTimestamp, setShowTimestamp] = useState(true);

  return (
    <div className="settings__section">
      <h3>Memory</h3>

      <div className="settings__group">
        <h4>Memory Behaviour</h4>

        <label className="setting">
          <span>Default memory view</span>
          <select
            value={settingsData.memoryView}
            onChange={(e) => {
              settingsAction.memoryView.set(e.currentTarget.value as MemoryView)
            }}
          >
            <option value={`timeline`}>Timeline</option>
            <option value={'tree'}>Tree</option>
            <option value={`list`}>List</option>
          </select>
        </label>

        <label className="setting">
          <span>Auto-create node on entry</span>
          <input
            type="checkbox"
            checked={autoCreateNode}
            onChange={() => setAutoCreateNode(!autoCreateNode)}
          />
        </label>
      </div>

      <div className="settings__group">
        <h4>Structure</h4>

        <label className="setting">
          <span>Auto link related memories</span>
          <input
            type="checkbox"
            checked={autoLink}
            onChange={() => setAutoLink(!autoLink)}
          />
        </label>

        <label className="setting">
          <span>Generate tags automatically</span>
          <input
            type="checkbox"
            checked={autoTag}
            onChange={() => setAutoTag(!autoTag)}
          />
        </label>

        <label className="setting">
          <span>Version tracking level</span>
          <select
            value={versionLevel}
            onChange={(e) => setVersionLevel(e.target.value)}
          >
            <option>Minimal</option>
            <option>Standard</option>
            <option>Full History</option>
          </select>
        </label>
      </div>

      <div className="settings__group">
        <h4>Timeline</h4>

        <label className="setting">
          <span>Group timeline by</span>
          <select
            value={timelineGroup}
            onChange={(e) => setTimelineGroup(e.target.value)}
          >
            <option>Day</option>
            <option>Week</option>
            <option>Month</option>
          </select>
        </label>

        <label className="setting">
          <span>Show timestamps</span>
          <input
            type="checkbox"
            checked={showTimestamp}
            onChange={() => setShowTimestamp(!showTimestamp)}
          />
        </label>
      </div>
    </div>
  );
};

export default MemorySettings;
