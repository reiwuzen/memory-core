import { SettingsService } from "@/service/settings.service";
import { useSettingsStore } from "@/store/useSettings.store";
import { MemoryView } from "@/types/settings";
export const useSettings = () => {
  const { clearData } = SettingsService();

  const {
    isOpen,
    view,
    theme,
    localOnlyMode,
    memoryView,
    debugsLog,
    analytics,
    resetSettings,
    setAnalytics,
    setDebugsLog,
    setLocalOnlyMode,
    setMemoryView,
    setTheme,
    setView,
    setIsOpen,
  } = useSettingsStore();

  const settingsData = {
    theme,
    localOnlyMode,
    memoryView,
    debugLogs: debugsLog,
    analytics,
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
    },

    localMode: {
      enable: () => setLocalOnlyMode(true),
      disable: () => setLocalOnlyMode(false),
      toggle: () => setLocalOnlyMode(!localOnlyMode),
    },

    analytics: {
      enable: () => setAnalytics(true),
      disable: () => setAnalytics(false),
      toggle: () => setAnalytics(!analytics),
    },

    debugLogs: {
      enable: () => setDebugsLog(true),
      disable: () => setDebugsLog(false),
      toggle: () => setDebugsLog(!debugsLog),
    },

    memoryView: {
      set: (m: MemoryView) => setMemoryView(m),
      presets: {
        list: () => setMemoryView("list"),
        timeline: () => setMemoryView("timeline"),
        tree: () => setMemoryView("tree"),
      },
    },

    reset: () => resetSettings(),
  };

  return {
    settingsData,
    settingsView,
    settingsAction,
    clearData,
  };
};
