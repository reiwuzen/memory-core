import { create } from "zustand";
import { TagState } from "@/types/tag";
export const useTagStore = create<TagState>((set) => ({
  tags: [],
  setTags: (t) =>
    set({
      tags: t,
    }),
  loading: false,
  setLoading: (l) =>
    set({
      loading: l,
    }),
  error: "",
  setError: (err) =>
    set({
      error: String(err),
    }),
}));
