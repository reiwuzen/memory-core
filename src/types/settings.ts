export type Theme ='light' | 'dark' | 'blueGrey' | 'system' | 'custom'
export type CustomThemeVariant = "aurora" | "forest" | "sunset" | "citrus"
export type MemoryView= 'timeline' | 'tree' | 'list'
export type BackupFrequency = "daily" | "weekly" | "manual"
export type VersionTrackingLevel = "minimal" | "standard" | "full"
export type TimelineGroupBy = "day" | "week" | "month"
type SettingsView = 'general' | 'memory' | 'privacy' | 'intelligence' | 'advanced'

export type StoreState = {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void

  view: SettingsView,
  setView: (s: SettingsView)=>void
    theme: Theme
    setTheme: (t: Theme) => void
    customThemeVariant: CustomThemeVariant
    setCustomThemeVariant: (v: CustomThemeVariant) => void

    memoryView: MemoryView
    setMemoryView: (mv: MemoryView) => void

    localOnlyMode: boolean
    setLocalOnlyMode: (b: boolean)=>void

    debugsLog: boolean,
    setDebugsLog: (dl: boolean) => void

    analytics: boolean,
    setAnalytics: (b:boolean) => void

    nsfwContent: boolean,
    setNsfwContent: (b: boolean) => void

    notifications: boolean,
    setNotifications: (b: boolean) => void

    aiAnalysis: boolean,
    setAiAnalysis: (b: boolean) => void

    autoBackup: boolean,
    setAutoBackup: (b: boolean) => void

    backupFrequency: BackupFrequency,
    setBackupFrequency: (f: BackupFrequency) => void

    performanceMode: boolean,
    setPerformanceMode: (b: boolean) => void

    reduceAnimations: boolean,
    setReduceAnimations: (b: boolean) => void

    hardwareAcceleration: boolean,
    setHardwareAcceleration: (b: boolean) => void

    autoCreateSnapshot: boolean,
    setAutoCreateSnapshot: (b: boolean) => void

    autoLinkRelated: boolean,
    setAutoLinkRelated: (b: boolean) => void

    autoGenerateTags: boolean,
    setAutoGenerateTags: (b: boolean) => void

    versionTrackingLevel: VersionTrackingLevel,
    setVersionTrackingLevel: (v: VersionTrackingLevel) => void

    timelineGroupBy: TimelineGroupBy,
    setTimelineGroupBy: (v: TimelineGroupBy) => void

    showTimestamps: boolean,
    setShowTimestamps: (b: boolean) => void

    sentimentAnalysis: boolean,
    setSentimentAnalysis: (b: boolean) => void

    memoryWeighting: boolean,
    setMemoryWeighting: (b: boolean) => void

    resetSettings: () => void
}

type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K
}[keyof T];

export type DefaultSettings = Pick<StoreState, NonFunctionKeys<StoreState>>;
