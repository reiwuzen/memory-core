export type Theme ='light' | 'dark' | 'blueGrey' | 'system' | 'custom'
export type MemoryView= 'timeline' | 'tree' | 'list'
type SettingsView = 'general' | 'memory' | 'privacy' | 'intelligence' | 'advanced'

export type StoreState = {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void

  view: SettingsView,
  setView: (s: SettingsView)=>void
    theme: Theme
    setTheme: (t: Theme) => void

    memoryView: MemoryView
    setMemoryView: (mv: MemoryView) => void

    localOnlyMode: boolean
    setLocalOnlyMode: (b: boolean)=>void

    debugsLog: boolean,
    setDebugsLog: (dl: boolean) => void

    analytics: boolean,
    setAnalytics: (b:boolean) => void

    resetSettings: () => void
}

type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K
}[keyof T];

export type DefaultSettings = Pick<StoreState, NonFunctionKeys<StoreState>>;
