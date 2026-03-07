import { useSettings } from "@/hooks/useSettings";

const IntelligenceSettings = () => {
  const { settingsData, settingsAction } = useSettings();

  return (
    <div className="settings__section">
      <h3>Intelligence</h3>
      <p className="hint">
        Experimental. Your data stays local unless you say otherwise.
      </p>

      <label className="setting">
        <span>Enable sentiment analysis</span>
        <input
          type="checkbox"
          checked={settingsData.sentimentAnalysis}
          onChange={settingsAction.sentimentAnalysis.toggle}
          disabled={!settingsData.aiAnalysis}
        />
      </label>

      <label className="setting">
        <span>Allow memory weighting</span>
        <input
          type="checkbox"
          checked={settingsData.memoryWeighting}
          onChange={settingsAction.memoryWeighting.toggle}
          disabled={!settingsData.aiAnalysis}
        />
      </label>
      {!settingsData.aiAnalysis ? (
        <p className="hint">Turn on "Allow AI to analyze memories" in Privacy & Storage first.</p>
      ) : null}
    </div>
  );
};
export default IntelligenceSettings;
