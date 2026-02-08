import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tag } from "@/types/tag";
import { useTagStore } from "@/store/useTag.store";
import { Result } from "@/types/result";

export const useTags = () => {
  const {tags,setTags,loading,setLoading,error,setError} =useTagStore();  

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
    await loadTags();
  }

  const addTagToNode = async (memoryId:string,nodeId:string,tag:Tag): Promise<Result<never,string>> => {
    try{

      await invoke("upsert_tag_on_node",{memoryId,nodeId,tag:tag})
      return{ok:true}
    } catch (err){
      return {ok:false, error: String(err)}
    }
  }
  const tagsActions ={
    save: saveTag,
    update: updateTag,
    remove: deleteTag
  }
  const tagsData = {
    tags,
    loading,
    error
  }
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return { tagsData,   reloadTags: loadTags,  tagsActions,addTagToNode };
};
