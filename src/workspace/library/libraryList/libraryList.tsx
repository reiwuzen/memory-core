import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";
import { useSettings } from "@/hooks/useSettings";
import { isNsfwPage } from "@/helper/isNsfwPage";
import { rankPages } from "@/helper/rankPages";
import type { NormalizedVersionedPage } from "@/types/page";
import "./libraryList.scss";

type LibraryListProps = {
  onOpenBook: (bookId: string) => void;
};

const LibraryList = ({ onOpenBook }: LibraryListProps) => {
  const { pagesStore, pageActions } = useLibrary();
  const { settingsData } = useSettings();
  const { setActiveTabTypeAndView } = useActiveTab();

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "updated" | "created" | "az">("priority");

  useEffect(() => {
    (async () => {
      await Promise.all([
        pageActions.pages.load().catch(() => {}),
        pageActions.books.load().catch(() => {}),
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankedPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = rankPages(pagesStore.pages).filter(({ page }) => {
      if (!settingsData.nsfwContent && isNsfwPage(page)) return false;
      if (page.pageMeta.bookId) return false;
      if (!q) return true;
      return (
        page.pageMeta.title.toLowerCase().includes(q) ||
        page.pageMeta.type.toLowerCase().includes(q)
      );
    });

    next.sort((a, b) => {
      if (sortBy === "priority") return b.score - a.score;
      if (sortBy === "az") return a.page.pageMeta.title.localeCompare(b.page.pageMeta.title);
      if (sortBy === "created") {
        return new Date(b.page.pageMeta.createdAt).getTime() - new Date(a.page.pageMeta.createdAt).getTime();
      }
      return (
        new Date(b.page.pageMeta.lastUpdatedAt || b.page.pageMeta.createdAt).getTime() -
        new Date(a.page.pageMeta.lastUpdatedAt || a.page.pageMeta.createdAt).getTime()
      );
    });

    return next;
  }, [pagesStore.pages, query, settingsData.nsfwContent, sortBy]);

  const booksFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pagesStore.books;
    return pagesStore.books.filter((book) => book.title.toLowerCase().includes(q));
  }, [pagesStore.books, query]);

  const pagesByBookId = useMemo(() => {
    return pagesStore.pages.reduce<Record<string, NormalizedVersionedPage[]>>((acc, page) => {
      if (!page.pageMeta.bookId) return acc;
      if (!acc[page.pageMeta.bookId]) acc[page.pageMeta.bookId] = [];
      acc[page.pageMeta.bookId].push(page);
      return acc;
    }, {});
  }, [pagesStore.pages]);

  const openPage = (page: NormalizedVersionedPage) => {
    pageActions.activePage.set(page);
    setActiveTabTypeAndView("library", "detail");
  };

  return (
    <div className="library-list">
      <div className="library-list-topbar">
        <div className="title-wrap">
          <h1>Library</h1>
          <p>
            {rankedPages.length} free pages | {pagesStore.books.length} books
          </p>
        </div>

        <div className="list-actions">
          <Button variant="ghost" onClick={() => setActiveTabTypeAndView("overview", "list")}>Back</Button>
          <Button variant="primary" onClick={() => setActiveTabTypeAndView("create", "picker")}>Create</Button>
        </div>
      </div>

      <div className="library-list-controls">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or type..."
        />

        <select
          value={sortBy}
          className="ui-select"
          onChange={(e) => setSortBy(e.target.value as "priority" | "updated" | "created" | "az")}
        >
          <option value="priority">Sort: Priority score</option>
          <option value="updated">Sort: Recently updated</option>
          <option value="created">Sort: Recently created</option>
          <option value="az">Sort: Title A-Z</option>
        </select>
      </div>

      <div className="library-list-sections">
        <section className="library-section">
          <div className="library-section-head">
            <h2>Books</h2>
            <span>{booksFiltered.length}</span>
          </div>
          <div className="library-list-items">
            {booksFiltered.length === 0 && <div className="library-section-empty">No books found.</div>}
            {booksFiltered.map((book) => {
              const members = pagesByBookId[book.id] ?? [];
              return (
                <article
                  key={book.id}
                  className="library-list-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    pageActions.activePage.clear();
                    onOpenBook(book.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      pageActions.activePage.clear();
                      onOpenBook(book.id);
                    }
                  }}
                >
                  <div className="library-list-item-head">
                    <h2>{book.title}</h2>
                    <Badge className="type-chip">{book.type}</Badge>
                  </div>
                  <div className="library-list-item-meta">
                    <span>Pages: {members.length}</span>
                    <span>Created: {new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="library-section">
          <div className="library-section-head">
            <h2>Pages</h2>
            <span>{rankedPages.length}</span>
          </div>
          <div className="library-list-items">
            {rankedPages.length === 0 && (
              <EmptyState
                title="No pages found"
                description="Only pages without a book are shown here."
                className="library-list-empty"
              />
            )}

            {rankedPages.map(({ page, score }) => (
              <article
                key={page.pageMeta.id}
                className="library-list-item"
                role="button"
                tabIndex={0}
                onClick={() => openPage(page)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPage(page);
                  }
                }}
              >
                <div className="library-list-item-head">
                  <h2>{page.pageMeta.title || "Untitled"}</h2>
                  <Badge className="type-chip">{page.pageMeta.type}</Badge>
                </div>

                <div className="library-list-item-priority">
                  <Badge>Score {score}</Badge>
                </div>

                <div className="library-list-item-meta">
                  <span>Snapshots: {page.normalizedSnapshots.ids.length}</span>
                  <span>Tags: {page.pageMeta.tags.length}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LibraryList;
