import { StoreState } from "@/types/settings";
import { create } from "zustand";

import { DEFAULT_SETTINGS as DS } from "@/constants/settings";

export const useSettingsStore = create<StoreState>((set)=>({
    theme: DS.theme,
    setTheme: (t)=> set({
        theme:t
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
    /**
     * resets the setting store
     * @returns void
     */
    resetSettings: () => set({
        theme: DS.theme,
        debugsLog: DS.debugsLog,
        memoryView:DS.memoryView,
        localOnlyMode:DS.localOnlyMode,
        analytics: DS.analytics
    })
})) 