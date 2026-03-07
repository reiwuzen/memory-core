import "./memorySettings.scss";
import { useSettings } from "@/hooks/useSettings";
import { MemoryView, TimelineGroupBy, VersionTrackingLevel } from "@/types/settings";
const MemorySettings = () => {
  const { settingsData, settingsAction } = useSettings();

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
            checked={settingsData.autoCreateNode}
            onChange={settingsAction.autoCreateNode.toggle}
          />
        </label>
      </div>

      <div className="settings__group">
        <h4>Structure</h4>

        <label className="setting">
          <span>Auto link related memories</span>
          <input
            type="checkbox"
            checked={settingsData.autoLinkRelated}
            onChange={settingsAction.autoLinkRelated.toggle}
          />
        </label>

        <label className="setting">
          <span>Generate tags automatically</span>
          <input
            type="checkbox"
            checked={settingsData.autoGenerateTags}
            onChange={settingsAction.autoGenerateTags.toggle}
          />
        </label>

        <label className="setting">
          <span>Version tracking level</span>
          <select
            value={settingsData.versionTrackingLevel}
            onChange={(e) => settingsAction.versionTrackingLevel.set(e.target.value as VersionTrackingLevel)}
          >
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="full">Full History</option>
          </select>
        </label>
      </div>

      <div className="settings__group">
        <h4>Timeline</h4>

        <label className="setting">
          <span>Group timeline by</span>
          <select
            value={settingsData.timelineGroupBy}
            onChange={(e) => settingsAction.timelineGroupBy.set(e.target.value as TimelineGroupBy)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>

        <label className="setting">
          <span>Show timestamps</span>
          <input
            type="checkbox"
            checked={settingsData.showTimestamps}
            onChange={settingsAction.showTimestamps.toggle}
          />
        </label>
      </div>
    </div>
  );
};

export default MemorySettings;
