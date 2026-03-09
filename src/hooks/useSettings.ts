import { SettingsService } from "@/service/settings.service";
import { useSettingsStore } from "@/store/useSettings.store";
import { BackupFrequency, CustomThemeVariant, MemoryView, TimelineGroupBy, VersionTrackingLevel } from "@/types/settings";
export const useSettings = () => {
  const { clearData, getPageStoreDir, openStorageFolder, exportMemoryDatabase } = SettingsService();

  const {
    isOpen,
    view,
    theme,
    customThemeVariant,
    localOnlyMode,
    memoryView,
    debugsLog,
    analytics,
    nsfwContent,
    notifications,
    aiAnalysis,
    autoBackup,
    backupFrequency,
    performanceMode,
    reduceAnimations,
    hardwareAcceleration,
    autoCreateSnapshot,
    autoLinkRelated,
    autoGenerateTags,
    versionTrackingLevel,
    timelineGroupBy,
    showTimestamps,
    sentimentAnalysis,
    memoryWeighting,
    resetSettings,
    setAnalytics,
    setDebugsLog,
    setLocalOnlyMode,
    setMemoryView,
    setTheme,
    setCustomThemeVariant,
    setView,
    setIsOpen,
    setNsfwContent,
    setNotifications,
    setAiAnalysis,
    setAutoBackup,
    setBackupFrequency,
    setPerformanceMode,
    setReduceAnimations,
    setHardwareAcceleration,
    setAutoCreateSnapshot,
    setAutoLinkRelated,
    setAutoGenerateTags,
    setVersionTrackingLevel,
    setTimelineGroupBy,
    setShowTimestamps,
    setSentimentAnalysis,
    setMemoryWeighting,
  } = useSettingsStore();

  const settingsData = {
    theme,
    customThemeVariant,
    localOnlyMode,
    memoryView,
    debugLogs: debugsLog,
    analytics,
    nsfwContent,
    notifications,
    aiAnalysis,
    autoBackup,
    backupFrequency,
    performanceMode,
    reduceAnimations,
    hardwareAcceleration,
    autoCreateSnapshot,
    autoLinkRelated,
    autoGenerateTags,
    versionTrackingLevel,
    timelineGroupBy,
    showTimestamps,
    sentimentAnalysis,
    memoryWeighting,
  };

  const settingsView = {
    isOpen:  {
      state: isOpen,
      actions: {
      enable: () => setIsOpen(true),
      disable: () => setIsOpen(false)
      }}
    ,
    
    view : {
      state: view,
      actions: {
        general:() => setView('general'),
        advanced: () => setView('advanced'),
        privacy: () => setView('privacy')
        , intelligence: () => setView('intelligence'),
        memory: () => setView('memory')
      }
    }
  }
  const settingsAction = {

    theme: {
      preset: {
        dark: () => setTheme("dark"),
        blueGrey: () => setTheme("blueGrey"),
        light: () => setTheme("light"),
        custom: () => setTheme("custom"),
        system: () => setTheme("system"),
      },
      customVariant: {
        set: (v: CustomThemeVariant) => setCustomThemeVariant(v),
      },
    },

    localMode: {
      enable: () => {
        setLocalOnlyMode(true);
        setAnalytics(false);
        setAiAnalysis(false);
      },
      disable: () => setLocalOnlyMode(false),
      toggle: () => {
        if (localOnlyMode) {
          setLocalOnlyMode(false);
          return;
        }
        setLocalOnlyMode(true);
        setAnalytics(false);
        setAiAnalysis(false);
      },
    },

    analytics: {
      enable: () => {
        if (localOnlyMode) return;
        setAnalytics(true);
      },
      disable: () => setAnalytics(false),
      toggle: () => {
        if (localOnlyMode) return;
        setAnalytics(!analytics);
      },
    },

    debugLogs: {
      enable: () => setDebugsLog(true),
      disable: () => setDebugsLog(false),
      toggle: () => setDebugsLog(!debugsLog),
    },

    nsfwContent: {
      enable: () => setNsfwContent(true),
      disable: () => setNsfwContent(false),
      toggle: () => setNsfwContent(!nsfwContent),
    },

    notifications: {
      enable: () => setNotifications(true),
      disable: () => setNotifications(false),
      toggle: () => setNotifications(!notifications),
    },

    aiAnalysis: {
      enable: () => {
        if (localOnlyMode) return;
        setAiAnalysis(true);
      },
      disable: () => setAiAnalysis(false),
      toggle: () => {
        if (localOnlyMode) return;
        setAiAnalysis(!aiAnalysis);
      },
    },

    autoBackup: {
      enable: () => setAutoBackup(true),
      disable: () => setAutoBackup(false),
      toggle: () => setAutoBackup(!autoBackup),
    },

    backupFrequency: {
      set: (f: BackupFrequency) => setBackupFrequency(f),
    },

    performanceMode: {
      enable: () => setPerformanceMode(true),
      disable: () => setPerformanceMode(false),
      toggle: () => setPerformanceMode(!performanceMode),
    },

    reduceAnimations: {
      enable: () => setReduceAnimations(true),
      disable: () => setReduceAnimations(false),
      toggle: () => setReduceAnimations(!reduceAnimations),
    },

    hardwareAcceleration: {
      enable: () => setHardwareAcceleration(true),
      disable: () => setHardwareAcceleration(false),
      toggle: () => setHardwareAcceleration(!hardwareAcceleration),
    },

    autoCreateSnapshot: {
      enable: () => setAutoCreateSnapshot(true),
      disable: () => setAutoCreateSnapshot(false),
      toggle: () => setAutoCreateSnapshot(!autoCreateSnapshot),
    },

    autoLinkRelated: {
      enable: () => setAutoLinkRelated(true),
      disable: () => setAutoLinkRelated(false),
      toggle: () => setAutoLinkRelated(!autoLinkRelated),
    },

    autoGenerateTags: {
      enable: () => setAutoGenerateTags(true),
      disable: () => setAutoGenerateTags(false),
      toggle: () => setAutoGenerateTags(!autoGenerateTags),
    },

    versionTrackingLevel: {
      set: (v: VersionTrackingLevel) => setVersionTrackingLevel(v),
    },

    timelineGroupBy: {
      set: (v: TimelineGroupBy) => setTimelineGroupBy(v),
    },

    showTimestamps: {
      enable: () => setShowTimestamps(true),
      disable: () => setShowTimestamps(false),
      toggle: () => setShowTimestamps(!showTimestamps),
    },

    sentimentAnalysis: {
      enable: () => setSentimentAnalysis(true),
      disable: () => setSentimentAnalysis(false),
      toggle: () => setSentimentAnalysis(!sentimentAnalysis),
    },

    memoryWeighting: {
      enable: () => setMemoryWeighting(true),
      disable: () => setMemoryWeighting(false),
      toggle: () => setMemoryWeighting(!memoryWeighting),
    },

    memoryView: {
      set: (m: MemoryView) => setMemoryView(m),
      presets: {
        list: () => setMemoryView("list"),
        timeline: () => setMemoryView("timeline"),
        tree: () => setMemoryView("tree"),
      },
    },

    storage: {
      getPath: getPageStoreDir,
      openFolder: openStorageFolder,
    },

    exportData: exportMemoryDatabase,

    reset: () => resetSettings(),
  };

  return {
    settingsData,
    settingsView,
    settingsAction,
    clearData,
  };
};
