import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tag } from "@/types/tag";

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadTags = useCallback(async () => {
    try {
        console.log("Loading tags...")
      setLoading(true);
      const data = await invoke<Tag[]>("load_all_tags");
      console.log("Tags data:", data);
      setTags(data);
      console.log("Tags loaded")
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTag = async (tag: Tag) => {
    await invoke("save_tag", { tag });
    await loadTags(); // sync source of truth
  };

  const updateTag = async (tag: Tag) => {
    await invoke("update_tag", { tag });
    await loadTags();
  };

  const deleteTag = async (tagId: string) => {
    await invoke("delete_tag", { tagId });
  }

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return { tags, loading, error, saveTag, updateTag, reload: loadTags, removeTag: deleteTag };
};
