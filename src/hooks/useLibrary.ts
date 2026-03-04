import { useLibraryStore } from "@/store/useLibrary.store";
import { useMemo } from "react";
import { PageService } from "@/service/page.service";
import { normalizeSnapshots } from "@/helper/normalizeSnapshots";
import { normalizeVersionedPages } from "@/helper/normaliseVersionedPage";
export const useLibrary = () => {
  const pages = useLibraryStore((s) => s.pages);
  const setPages = useLibraryStore((s) => s.setPages);
  const activePage = useLibraryStore((s) => s.activePage);
  const setActivePage = useLibraryStore((s) => s.setActivePage);
  const {
    createPage,
    createNewSnapshotOfPage,
    deletePage,
    loadPages,
    reloadPage,
    upsertTagOnPage,
    deleteTagFromPage,
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
      reload: async () => {
        if (!activePage) return
        (await reloadPage(activePage.pageMeta.id)).match(
          (vp) =>
            setActivePage({
              pageMeta: vp.pageMeta,
              normalizedSnapshots: normalizeSnapshots(vp.snapshots),
            }),
          () => {},
        );
      },
    },

    page: {
      create: createPage,
      createNewSnapshot: createNewSnapshotOfPage,
      delete: deletePage,
      addTag: (pageId: string, tagId: string) => {
        return upsertTagOnPage(pageId, tagId);
      },
      removeTag: (pageId: string, tagId: string) => {
        return deleteTagFromPage(pageId, tagId);
      },
    },
    pages: {
      load: async () => {
        const res = await loadPages();
        if (res.ok) {
          setPages(normalizeVersionedPages(res.value));
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
