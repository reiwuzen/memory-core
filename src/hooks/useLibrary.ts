import { useLibraryStore } from "@/store/useLibrary.store";
import { useMemo } from "react";
import { PageService } from "@/service/page.service";
import { BookService } from "@/service/book.service";
import { normalizeSnapshots } from "@/helper/normalizeSnapshots";
import { normalizeVersionedPages } from "@/helper/normaliseVersionedPage";
import type { NormalizedVersionedPage, PageType } from "@/types/page";
export const useLibrary = () => {
  const pages = useLibraryStore((s) => s.pages);
  const setPages = useLibraryStore((s) => s.setPages);
  const books = useLibraryStore((s) => s.books);
  const setBooks = useLibraryStore((s) => s.setBooks);
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
    setBookIdOnPage,
  } = PageService();
  const { create: createBook, loadAll: loadBooks } = BookService();
  const pagesStore = useMemo(() => {
    return {
      activePage: activePage,
      pages,
      books,
    };
  }, [activePage, books, pages]);

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
      setBookId: async (pageId: string, bookId: string | null) => {
        const res = await setBookIdOnPage(pageId, bookId);

        if (res.ok) {
          const latestPages = useLibraryStore.getState().pages;
          const updatedPages = latestPages.map((p) =>
            p.pageMeta.id === pageId
              ? ({ ...p, pageMeta: res.value } as NormalizedVersionedPage)
              : p,
          );
          setPages(updatedPages);

          const latestActivePage = useLibraryStore.getState().activePage;
          if (latestActivePage?.pageMeta.id === pageId) {
            setActivePage({
              ...latestActivePage,
              pageMeta: res.value,
            });
          }
        }

        return res;
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
    books: {
      load: async () => {
        const res = await loadBooks();
        if (res.ok) setBooks(res.value);
        else setBooks([]);
        return { ok: res.ok };
      },
      create: async (title: string, type: PageType) => {
        const res = await createBook(title, type);
        if (res.ok) {
          setBooks([...useLibraryStore.getState().books, res.value]);
        }
        return res;
      },
    },
  };
  return {
    pagesStore,
    pageActions,
  };
};
