import { create } from "zustand";
import type { VersionedPage } from "@/types/page";

type LibraryStore = {
  pages: VersionedPage[]
  setPages: (p: VersionedPage[]) => void;
  activePage: VersionedPage
  setActivePage: (p : VersionedPage) => void
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
