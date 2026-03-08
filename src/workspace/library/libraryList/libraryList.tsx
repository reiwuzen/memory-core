import { useLibrary } from "@/hooks/useLibrary";
import "./libraryList.scss";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useEffect, useMemo, useState } from "react";
import { appToast, Badge, Button, EmptyState, Input, Modal } from "@/components/ui";
import { rankPages, type RankedPage } from "@/helper/rankPages";
import { useSettings } from "@/hooks/useSettings";
import { isNsfwPage } from "@/helper/isNsfwPage";
import type { NormalizedVersionedPage, PageType } from "@/types/page";
import type { Book } from "@/types/book";

const LibraryList = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { settingsData } = useSettings();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "updated" | "created" | "az">("priority");
  const [openBookPicker, setOpenBookPicker] = useState<{ book: Book; members: RankedPage[] } | null>(null);
  const [addExistingBook, setAddExistingBook] = useState<Book | null>(null);
  const [selectedExistingPageIds, setSelectedExistingPageIds] = useState<string[]>([]);
  const [existingPageQuery, setExistingPageQuery] = useState("");

  useEffect(() => {
    (async () => {
      await Promise.all([
        pageActions.pages.load().catch((err) => console.error("[err]: ", err)),
        pageActions.books.load().catch((err) => console.error("[err]: ", err)),
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = rankPages(pagesStore.pages).filter(({ page }) => {
      if (!settingsData.nsfwContent && isNsfwPage(page)) return false;
      const { pageMeta } = page;
      if (!q) return true;
      return pageMeta.title.toLowerCase().includes(q) || pageMeta.type.toLowerCase().includes(q);
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

  const rankedPagesAll = useMemo(() => {
    return rankPages(pagesStore.pages).filter(({ page }) => {
      if (!settingsData.nsfwContent && isNsfwPage(page)) return false;
      return true;
    });
  }, [pagesStore.pages, settingsData.nsfwContent]);

  const booksFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = [...pagesStore.books];
    if (q) {
      return next.filter((b) => b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
    }
    return next;
  }, [pagesStore.books, query]);

  const pagesByBookId = useMemo(() => {
    return rankedPagesAll.reduce<Record<string, RankedPage[]>>((acc, p) => {
      const bookId = p.page.pageMeta.bookId;
      if (!bookId) return acc;
      acc[bookId] = [...(acc[bookId] ?? []), p];
      return acc;
    }, {});
  }, [rankedPagesAll]);

  const unassignedPages = useMemo(
    () => filteredPages.filter((p) => !p.page.pageMeta.bookId),
    [filteredPages],
  );

  const typeStats = useMemo(() => {
    return pagesStore.pages.reduce<Record<string, number>>((acc, { pageMeta }) => {
      acc[pageMeta.type] = (acc[pageMeta.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [pagesStore.pages]);

  const openPage = (page: NormalizedVersionedPage) => {
    pageActions.activePage.set({
      pageMeta: page.pageMeta,
      normalizedSnapshots: page.normalizedSnapshots,
    });
    setActiveTabTypeAndView("library", "detail");
  };

  const createPageForBook = async (book: Book) => {
    const createRes = await pageActions.page.create(book.title, book.type as PageType);
    if (!createRes.ok) {
      appToast.error(`Failed to create page for ${book.title}`);
      return;
    }

    const setBookRes = await pageActions.page.setBookId(createRes.value.pageMeta.id, book.id);
    if (!setBookRes.ok) {
      appToast.error(`Failed to assign book to new page`);
      return;
    }

    appToast.success(`Created new page in ${book.title}`);
    await pageActions.pages.load();
  };

  const toggleExistingPage = (pageId: string) => {
    setSelectedExistingPageIds((prev) => (prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]));
  };

  const addExistingPagesToBook = async () => {
    if (!addExistingBook) return;
    if (selectedExistingPageIds.length === 0) {
      appToast.info("Select at least one page.");
      return;
    }

    for (const pageId of selectedExistingPageIds) {
      const res = await pageActions.page.setBookId(pageId, addExistingBook.id);
      if (!res.ok) {
        appToast.error(`Failed to add page ${pageId}`);
        return;
      }
    }

    appToast.success(`Added ${selectedExistingPageIds.length} page(s) to ${addExistingBook.title}`);
    setSelectedExistingPageIds([]);
    setAddExistingBook(null);
  };

  const addExistingCandidates = useMemo(() => {
    if (!addExistingBook) return [] as RankedPage[];
    return rankedPagesAll.filter((item) => item.page.pageMeta.bookId !== addExistingBook.id);
  }, [addExistingBook, rankedPagesAll]);

  const filteredExistingCandidates = useMemo(() => {
    const q = existingPageQuery.trim().toLowerCase();
    if (!q) return addExistingCandidates;
    return addExistingCandidates.filter((item) => {
      const meta = item.page.pageMeta;
      return meta.title.toLowerCase().includes(q) || meta.type.toLowerCase().includes(q);
    });
  }, [addExistingCandidates, existingPageQuery]);

  const selectedExistingPageIdsSet = useMemo(() => {
    return new Set(selectedExistingPageIds);
  }, [selectedExistingPageIds]);

  return (
    <div className="library-list">
      <div className="library-list-topbar">
        <div className="title-wrap">
          <h1>Library</h1>
          <p>
            {pagesStore.pages.length} pages | {pagesStore.books.length} books
          </p>
        </div>

        <div className="list-actions">
          <Button
            variant="ghost"
            onClick={async () => {
              await Promise.all([pageActions.pages.load(), pageActions.books.load()]);
            }}
          >
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setActiveTabTypeAndView("create", "picker")}>
            New Page
          </Button>
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

      <div className="library-list-stats">
        {Object.entries(typeStats).map(([type, count]) => (
          <div key={type} className="stat-pill">
            <span>{type}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="library-list-sections">
        <section className="library-section">
          <div className="library-section-head">
            <h2>Books</h2>
            <span>{booksFiltered.length}</span>
          </div>
          <div className="library-list-items">
            {booksFiltered.length === 0 && <div className="library-section-empty">No books found</div>}
            {booksFiltered.map((book) => {
              const members = pagesByBookId[book.id] ?? [];
              const snapshotsCount = members.reduce((sum, member) => sum + member.page.normalizedSnapshots.ids.length, 0);

              return (
                <article
                  key={book.id}
                  className="library-list-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenBookPicker({ book, members })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenBookPicker({ book, members });
                    }
                  }}
                >
                  <div className="library-list-item-head">
                    <h2>{book.title}</h2>
                    <div className="library-list-item-actions">
                      <Badge className="type-chip">{book.type}</Badge>
                    </div>
                  </div>

                  <div className="library-list-item-meta">
                    <span>Pages: {members.length}</span>
                    <span>Snapshots: {snapshotsCount}</span>
                    <span title={book.id}>Book ID: {book.id.slice(0, 14)}...</span>
                  </div>

                  <div className="library-list-item-footer">
                    <Button
                      variant="ghost"
                      className="unmerge-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void createPageForBook(book);
                      }}
                    >
                      New Page
                    </Button>
                    <Button
                      variant="ghost"
                      className="unmerge-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setAddExistingBook(book);
                        setSelectedExistingPageIds([]);
                        setExistingPageQuery("");
                      }}
                    >
                      Add Existing Pages
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="library-section">
          <div className="library-section-head">
            <h2>Pages</h2>
            <span>{unassignedPages.length}</span>
          </div>
          <div className="library-list-items">
            {unassignedPages.length === 0 && (
              <EmptyState
                title="No pages found"
                description="Create a new page or add existing pages into books."
                className="library-list-empty"
              />
            )}

            {unassignedPages.map(({ page, score, reasons }) => (
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
                  <h2>{page.pageMeta.title}</h2>
                  <Badge className="type-chip">{page.pageMeta.type}</Badge>
                </div>

                <div className="library-list-item-priority">
                  <Badge title={reasons.map((reason) => `- ${reason}`).join("\n")} aria-label={`Priority score ${score}`}>
                    Score {score}
                  </Badge>
                </div>

                <div className="library-list-item-meta">
                  <span>Snapshots: {page.normalizedSnapshots.ids.length}</span>
                  <span>Tags: {page.pageMeta.tags.length}</span>
                </div>

                <div className="library-list-item-footer">
                  <span>Updated: {new Date(page.pageMeta.lastUpdatedAt || page.pageMeta.createdAt).toLocaleDateString()}</span>
                  <span>Created: {new Date(page.pageMeta.createdAt).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Modal
        title={openBookPicker ? `Open Book ${openBookPicker.book.title}` : "Open Book"}
        isOpen={!!openBookPicker}
        onClose={() => setOpenBookPicker(null)}
      >
        <div className="book-picker-list">
          {openBookPicker && openBookPicker.members.length === 0 && (
            <div className="library-section-empty">This book has no pages yet.</div>
          )}
          {openBookPicker?.members.map((member) => (
            <button
              key={member.page.pageMeta.id}
              className="book-picker-item"
              onClick={() => {
                openPage(member.page);
                setOpenBookPicker(null);
              }}
            >
              <div className="book-picker-item-head">
                <strong>{member.page.pageMeta.title}</strong>
                <Badge className="type-chip">{member.page.pageMeta.type}</Badge>
              </div>
              <div className="book-picker-item-meta">
                <span>Score {member.score}</span>
                <span>{member.page.normalizedSnapshots.ids.length} snapshots</span>
                <span>{member.page.pageMeta.tags.length} tags</span>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        title={addExistingBook ? `Add Existing Pages to ${addExistingBook.title}` : "Add Existing Pages"}
        isOpen={!!addExistingBook}
        onClose={() => {
          setAddExistingBook(null);
          setSelectedExistingPageIds([]);
          setExistingPageQuery("");
        }}
        actions={(
          <Button variant="primary" onClick={() => void addExistingPagesToBook()}>
            Add Selected ({selectedExistingPageIds.length})
          </Button>
        )}
      >
        <div className="add-existing-panel">
          <div className="add-existing-header">
            <div className="add-existing-title-wrap">
              <h3>Choose pages to add</h3>
              <p>Scroll cards horizontally and select one or more pages.</p>
            </div>
            <div className="add-existing-stats">
              <span>Available {filteredExistingCandidates.length}</span>
              <span>Selected {selectedExistingPageIds.length}</span>
            </div>
          </div>

          <div className="add-existing-toolbar">
            <Input
              type="search"
              value={existingPageQuery}
              onChange={(e) => setExistingPageQuery(e.target.value)}
              placeholder="Search by page title or type..."
            />
            <div className="add-existing-actions">
              <Button
                variant="ghost"
                onClick={() => setSelectedExistingPageIds(filteredExistingCandidates.map((item) => item.page.pageMeta.id))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedExistingPageIds([])}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="book-picker-list add-existing-slider">
            {filteredExistingCandidates.length === 0 && (
              <div className="library-section-empty">No matching pages found. Try a different search.</div>
            )}
            {filteredExistingCandidates.map((member) => {
              const isSelected = selectedExistingPageIdsSet.has(member.page.pageMeta.id);
              return (
                <label key={member.page.pageMeta.id} className={`book-picker-item add-existing-item ${isSelected ? "is-selected" : ""}`}>
                  <div className="book-picker-item-head">
                    <strong>{member.page.pageMeta.title}</strong>
                    <input
                      className="existing-page-checkbox"
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExistingPage(member.page.pageMeta.id)}
                    />
                  </div>
                  <div className="book-picker-item-meta">
                    <span>{member.page.pageMeta.type}</span>
                    <span>Score {member.score}</span>
                    <span>{member.page.normalizedSnapshots.ids.length} snapshots</span>
                    {member.page.pageMeta.bookId ? <span>From {member.page.pageMeta.bookId.slice(0, 10)}...</span> : <span>Unassigned</span>}
                  </div>
                  <div className="add-existing-item-foot">
                    {isSelected ? <span className="selection-state">Selected</span> : <span className="selection-state muted">Tap to select</span>}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="add-existing-hint">Tip: selected pages are highlighted. Use Select All for the current search results.</div>
        </div>
      </Modal>
    </div>
  );
};

export default LibraryList;
