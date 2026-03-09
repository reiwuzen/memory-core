import { create } from "zustand";
import type { NormalizedVersionedPage } from "@/types/page";
import type { Book } from "@/types/book";

type LibraryStore = {
  pages: NormalizedVersionedPage[]
  setPages: (p: NormalizedVersionedPage[]) => void;
  books: Book[]
  setBooks: (b: Book[]) => void;
  activePage: NormalizedVersionedPage
  setActivePage: (p : NormalizedVersionedPage) => void
};

export const useLibraryStore = create<LibraryStore>((set) => ({
  pages: [],
 setPages: (p)=>set({
  pages: p
 }),
 setBooks: (b)=>set({
  books: b
 }),
  books: [],
  activePage: null,
  setActivePage: (p)=> set({
    activePage:p
  }), 
}));
