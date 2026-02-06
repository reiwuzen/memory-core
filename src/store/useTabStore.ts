import { create } from "zustand";
import { TabStore } from "@/types/tab";

export const useTabStore = create<TabStore>((set) => ({
  tabs: [
    {
      id: "tab-1",
      title: "Overview",
      type: "overview",
      isActive: true,
      timeline: [],
      view: undefined,
    },
  ],
  activeTabId: "tab-1",

  setActiveTabId: (id) =>
    set({
      activeTabId: id,
    }),

  switchTab: (id, type, view) =>
  set((state) => ({
    activeTabId: id,
    tabs: state.tabs.map((tab) =>
      tab.id === id
        ? {
            ...tab,
            type,
            view,
          }
        : tab
    ),
  })),

}));
