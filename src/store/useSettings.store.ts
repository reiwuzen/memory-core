import { StoreState } from "@/types/settings";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_SETTINGS as DS } from "@/constants/settings";

export const useSettingsStore = create<StoreState>()(persist((set)=>({
    isOpen: false,
    setIsOpen: (isOpen) => set({
        isOpen: isOpen
    }),
view: 'general',
setView:(s)=> set({
    view:s
}),
    theme: DS.theme,
    setTheme: (t)=> set({
        theme:t
    }),
    customThemeVariant: DS.customThemeVariant,
    setCustomThemeVariant: (v) => set({
        customThemeVariant: v
    }),
    //
    memoryView: DS.memoryView,
    setMemoryView: (mv)=> set({
        memoryView:mv
    })
    ,
    localOnlyMode: DS.localOnlyMode,
    setLocalOnlyMode: (b)=>set({
        localOnlyMode: b
    }),
    debugsLog: DS.debugsLog,
    setDebugsLog:(dl)=> set({
        debugsLog: dl
    }),
    analytics: DS.analytics,
    setAnalytics: (b)=>set({
        analytics:b
    }),
    nsfwContent: DS.nsfwContent,
    setNsfwContent: (b) => set({
        nsfwContent: b,
    }),
    notifications: DS.notifications,
    setNotifications: (b) => set({
        notifications: b,
    }),
    aiAnalysis: DS.aiAnalysis,
    setAiAnalysis: (b) => set({
        aiAnalysis: b,
    }),
    autoBackup: DS.autoBackup,
    setAutoBackup: (b) => set({
        autoBackup: b,
    }),
    backupFrequency: DS.backupFrequency,
    setBackupFrequency: (f) => set({
        backupFrequency: f,
    }),
    performanceMode: DS.performanceMode,
    setPerformanceMode: (b) => set({
        performanceMode: b,
    }),
    reduceAnimations: DS.reduceAnimations,
    setReduceAnimations: (b) => set({
        reduceAnimations: b,
    }),
    hardwareAcceleration: DS.hardwareAcceleration,
    setHardwareAcceleration: (b) => set({
        hardwareAcceleration: b,
    }),
    autoCreateSnapshot: DS.autoCreateSnapshot,
    setAutoCreateSnapshot: (b) => set({
        autoCreateSnapshot: b,
    }),
    autoLinkRelated: DS.autoLinkRelated,
    setAutoLinkRelated: (b) => set({
        autoLinkRelated: b,
    }),
    autoGenerateTags: DS.autoGenerateTags,
    setAutoGenerateTags: (b) => set({
        autoGenerateTags: b,
    }),
    versionTrackingLevel: DS.versionTrackingLevel,
    setVersionTrackingLevel: (v) => set({
        versionTrackingLevel: v,
    }),
    timelineGroupBy: DS.timelineGroupBy,
    setTimelineGroupBy: (v) => set({
        timelineGroupBy: v,
    }),
    showTimestamps: DS.showTimestamps,
    setShowTimestamps: (b) => set({
        showTimestamps: b,
    }),
    sentimentAnalysis: DS.sentimentAnalysis,
    setSentimentAnalysis: (b) => set({
        sentimentAnalysis: b,
    }),
    memoryWeighting: DS.memoryWeighting,
    setMemoryWeighting: (b) => set({
        memoryWeighting: b,
    }),
    /**
     * resets the setting store
     * @returns void
     */
    resetSettings: () => set({
        theme: DS.theme,
        customThemeVariant: DS.customThemeVariant,
        debugsLog: DS.debugsLog,
        memoryView:DS.memoryView,
        localOnlyMode:DS.localOnlyMode,
        analytics: DS.analytics,
        nsfwContent: DS.nsfwContent,
        notifications: DS.notifications,
        aiAnalysis: DS.aiAnalysis,
        autoBackup: DS.autoBackup,
        backupFrequency: DS.backupFrequency,
        performanceMode: DS.performanceMode,
        reduceAnimations: DS.reduceAnimations,
        hardwareAcceleration: DS.hardwareAcceleration,
        autoCreateSnapshot: DS.autoCreateSnapshot,
        autoLinkRelated: DS.autoLinkRelated,
        autoGenerateTags: DS.autoGenerateTags,
        versionTrackingLevel: DS.versionTrackingLevel,
        timelineGroupBy: DS.timelineGroupBy,
        showTimestamps: DS.showTimestamps,
        sentimentAnalysis: DS.sentimentAnalysis,
        memoryWeighting: DS.memoryWeighting,
    })
}), {
    name: "zensys-settings",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        theme: state.theme,
        customThemeVariant: state.customThemeVariant,
        memoryView: state.memoryView,
        localOnlyMode: state.localOnlyMode,
        debugsLog: state.debugsLog,
        analytics: state.analytics,
        nsfwContent: state.nsfwContent,
        notifications: state.notifications,
        aiAnalysis: state.aiAnalysis,
        autoBackup: state.autoBackup,
        backupFrequency: state.backupFrequency,
        performanceMode: state.performanceMode,
        reduceAnimations: state.reduceAnimations,
        hardwareAcceleration: state.hardwareAcceleration,
        autoCreateSnapshot: state.autoCreateSnapshot,
        autoLinkRelated: state.autoLinkRelated,
        autoGenerateTags: state.autoGenerateTags,
        versionTrackingLevel: state.versionTrackingLevel,
        timelineGroupBy: state.timelineGroupBy,
        showTimestamps: state.showTimestamps,
        sentimentAnalysis: state.sentimentAnalysis,
        memoryWeighting: state.memoryWeighting,
    }),
})) 
