import { create } from "zustand";
import type { NormalizedVersionedPage } from "@/types/page";

type LibraryStore = {
  pages: NormalizedVersionedPage[]
  setPages: (p: NormalizedVersionedPage[]) => void;
  activePage: NormalizedVersionedPage
  setActivePage: (p : NormalizedVersionedPage) => void
};

export const useLibraryStore = create<LibraryStore>((set) => ({
  pages: [],
 setPages: (p)=>set({
  pages: p
 }),
  activePage: null,
  setActivePage: (p)=> set({
    activePage:p
  }), 
}));
