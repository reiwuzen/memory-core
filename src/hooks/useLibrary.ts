import { useLibraryStore } from "@/store/useLibrary.store";
import { useMemo } from "react";
import { PageService } from "@/service/page.service";
export const useLibrary = () => {
  const {pages,setPages,activePage,setActivePage } = useLibraryStore();
  const {
    createPage,
    createNewSnapshotOfPage,
    deletePage,
    loadPages,
    reloadPage,
    upsertTagOnPage,
    deleteTagFromPage
  } = PageService();
  const pagesStore = useMemo(() => {
    return {
      activePage: activePage,
      pages,
    };
  }, [activePage, pages]);

  const pageActions = {
    activePage: {
      clear: () => setActivePage(null),
      set: setActivePage,
      reload: reloadPage,

    },

    page: {
      create: createPage,
      createNewSnapshot: createNewSnapshotOfPage,
      delete: deletePage,
      addTag: (pageId:string,tagId:string)=>{
        return upsertTagOnPage(pageId,tagId)},
      removeTag: (pageId:string,tagId:string) => {
        return deleteTagFromPage(pageId,tagId)
      }
    },
    pages: {
      load: async () => {
        const res = await loadPages();
        if (res.ok) {
          setPages([...res.value]);
        } else {
          setPages([]);
        }
        return { ok: res.ok };
      },
    },
  };
  return {
    pagesStore,
    pageActions,
  };
};
