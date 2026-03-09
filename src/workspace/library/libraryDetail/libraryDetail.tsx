import { useMemo, useState } from "react";
import { appToast, Badge, Button, Input } from "@/components/ui";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";
import type { Book } from "@/types/book";
import type { PageType } from "@/types/page";
import "./libraryDetail.scss";

type LibraryDetailProps = {
  book: Book;
  onBack: () => void;
};

const PAGE_TYPES: PageType[] = ["generic", "diary", "fact", "event"];

const LibraryDetail = ({ book, onBack }: LibraryDetailProps) => {
  const { pageActions, pagesStore } = useLibrary();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageType, setNewPageType] = useState<PageType>(book.type === "generic" ? "generic" : book.type);
  const [existingQuery, setExistingQuery] = useState("");
  const [selectedExistingPageIds, setSelectedExistingPageIds] = useState<string[]>([]);
  const [bookPageOrder, setBookPageOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`book-order:${book.id}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  });

  const bookPages = useMemo(() => {
    const pages = pagesStore.pages.filter((page) => page.pageMeta.bookId === book.id);
    const orderMap = new Map(bookPageOrder.map((id, idx) => [id, idx]));

    return [...pages].sort((a, b) => {
      const ai = orderMap.get(a.pageMeta.id);
      const bi = orderMap.get(b.pageMeta.id);
      if (ai !== undefined && bi !== undefined) return ai - bi;
      if (ai !== undefined) return -1;
      if (bi !== undefined) return 1;
      return new Date(a.pageMeta.createdAt).getTime() - new Date(b.pageMeta.createdAt).getTime();
    });
  }, [book.id, bookPageOrder, pagesStore.pages]);

  const persistBookOrder = (nextOrder: string[]) => {
    setBookPageOrder(nextOrder);
    localStorage.setItem(`book-order:${book.id}`, JSON.stringify(nextOrder));
  };

  const eligibleExistingPages = useMemo(() => {
    const lowerQuery = existingQuery.trim().toLowerCase();

    return pagesStore.pages.filter((page) => {
      if (page.pageMeta.bookId !== null) return false;

      const typeMatch = book.type === "generic" || page.pageMeta.type === book.type;
      if (!typeMatch) return false;

      if (!lowerQuery) return true;
      return (
        page.pageMeta.title.toLowerCase().includes(lowerQuery) ||
        page.pageMeta.type.toLowerCase().includes(lowerQuery)
      );
    });
  }, [book.type, existingQuery, pagesStore.pages]);

  const selectedPageIdsSet = useMemo(() => new Set(selectedExistingPageIds), [selectedExistingPageIds]);

  const toggleExistingPage = (pageId: string) => {
    setSelectedExistingPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId],
    );
  };

  const openPage = (pageId: string) => {
    const target = pagesStore.pages.find((page) => page.pageMeta.id === pageId);
    if (!target) return;

    pageActions.activePage.set(target);
    setActiveTabTypeAndView("library", "detail");
  };

  const moveBookPage = (pageId: string, direction: "up" | "down") => {
    const source = bookPages.map((page) => page.pageMeta.id);
    const currentIndex = source.indexOf(pageId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= source.length) return;

    const next = [...source];
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);
    persistBookOrder(next);
  };

  const deselectPageFromBook = async (pageId: string) => {
    const res = await pageActions.page.setBookId(pageId, null);
    if (!res.ok) {
      appToast.error("Failed to remove page from book.");
      return;
    }

    const nextOrder = bookPageOrder.filter((id) => id !== pageId);
    persistBookOrder(nextOrder);
    appToast.success("Removed page from book.");
    await pageActions.pages.load();
  };

  const attachSelectedPages = async () => {
    if (selectedExistingPageIds.length === 0) {
      appToast.info("Select at least one page.");
      return;
    }

    const results = await Promise.all(
      selectedExistingPageIds.map((pageId) => pageActions.page.setBookId(pageId, book.id)),
    );

    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      appToast.error(`Failed to add ${failed.length} page(s).`);
      return;
    }

    appToast.success(`Added ${selectedExistingPageIds.length} page(s).`);
    const currentIds = bookPages.map((page) => page.pageMeta.id);
    const merged = [...currentIds, ...selectedExistingPageIds.filter((id) => !currentIds.includes(id))];
    persistBookOrder(merged);
    setSelectedExistingPageIds([]);
    await pageActions.pages.load();
  };

  const createNewPageInBook = async () => {
    const title = newPageTitle.trim();
    if (!title) {
      appToast.info("Enter a page title.");
      return;
    }

    const type = book.type === "generic" ? newPageType : book.type;
    const createRes = await pageActions.page.create(title, type);

    if (!createRes.ok) {
      appToast.error("Failed to create page.");
      return;
    }

    const setBookRes = await pageActions.page.setBookId(createRes.value.pageMeta.id, book.id);
    if (!setBookRes.ok) {
      appToast.error("Page created, but failed to add it to this book.");
      return;
    }

    appToast.success("Created page in book.");
    const nextOrder = [...bookPages.map((page) => page.pageMeta.id), createRes.value.pageMeta.id];
    persistBookOrder(nextOrder);
    setNewPageTitle("");
    setNewPageType(book.type === "generic" ? "generic" : book.type);
    await pageActions.pages.load();
  };

  return (
    <section className="library-detail">
      <header className="library-detail-topbar">
        <div>
          <h1>{book.title}</h1>
          <p>
            Type: <strong>{book.type}</strong> | Pages: {bookPages.length}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>Back</Button>
      </header>

      <div className="library-detail-sections">
        <section className="library-detail-section">
          <div className="library-detail-section-head">
            <h2>Pages in Book</h2>
            <span>{bookPages.length}</span>
          </div>

          <div className="library-detail-page-list">
            {bookPages.length === 0 && <p className="library-detail-empty">No pages in this book yet.</p>}
            {bookPages.map((page) => (
              <div
                key={page.pageMeta.id}
                className="library-detail-page-item"
              >
                <button
                  className="page-open-btn"
                  onClick={() => openPage(page.pageMeta.id)}
                >
                  <div>
                    <strong>{page.pageMeta.title || "Untitled"}</strong>
                    <p>{page.normalizedSnapshots.ids.length} snapshots</p>
                  </div>
                  <Badge>{page.pageMeta.type}</Badge>
                </button>
                <div className="page-order-actions">
                  <Button
                    variant="ghost"
                    onClick={() => moveBookPage(page.pageMeta.id, "up")}
                    aria-label="Move page up"
                  >
                    Up
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => moveBookPage(page.pageMeta.id, "down")}
                    aria-label="Move page down"
                  >
                    Down
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void deselectPageFromBook(page.pageMeta.id)}
                    aria-label="Remove page from book"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="library-detail-section">
          <div className="library-detail-section-head">
            <h2>Add Existing Pages</h2>
            <span>{eligibleExistingPages.length}</span>
          </div>

          <Input
            type="search"
            value={existingQuery}
            onChange={(e) => setExistingQuery(e.target.value)}
            placeholder="Search existing pages..."
          />

          <div className="library-detail-existing-list">
            {eligibleExistingPages.length === 0 && (
              <p className="library-detail-empty">No eligible existing pages.</p>
            )}

            {eligibleExistingPages.map((page) => {
              const isSelected = selectedPageIdsSet.has(page.pageMeta.id);
              return (
                <label
                  key={page.pageMeta.id}
                  className={`library-detail-existing-item ${isSelected ? "is-selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleExistingPage(page.pageMeta.id)}
                  />
                  <span>{page.pageMeta.title || "Untitled"}</span>
                  <Badge>{page.pageMeta.type}</Badge>
                </label>
              );
            })}
          </div>

          <Button variant="primary" onClick={() => void attachSelectedPages()}>
            Add Selected ({selectedExistingPageIds.length})
          </Button>
        </section>

        <section className="library-detail-section">
          <div className="library-detail-section-head">
            <h2>Create New Page</h2>
          </div>

          <Input
            type="text"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            placeholder="New page title"
          />

          <select
            className="ui-select"
            value={newPageType}
            disabled={book.type !== "generic"}
            onChange={(e) => setNewPageType(e.target.value as PageType)}
          >
            {PAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <p className="library-detail-note">
            {book.type === "generic"
              ? "Generic books can create any page type."
              : `This book can create only ${book.type} pages.`}
          </p>

          <Button variant="primary" onClick={() => void createNewPageInBook()}>
            Create New Page
          </Button>
        </section>
      </div>
    </section>
  );
};

export default LibraryDetail;
