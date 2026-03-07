import { useLibrary } from "@/hooks/useLibrary";
import "./libraryList.scss";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import { rankPages } from "@/helper/rankPages";
import { useSettings } from "@/hooks/useSettings";
import { isNsfwPage } from "@/helper/isNsfwPage";

const LibraryList = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { settingsData } = useSettings();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "updated" | "created" | "az">("priority");

  useEffect(() => {
    (async () => {
      await pageActions.pages.load().catch((err) => console.error("[err]: ", err));
    })();
    // load once when entering library list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = rankPages(pagesStore.pages).filter(({ page }) => {
      if (!settingsData.nsfwContent && isNsfwPage(page)) return false;
      const { pageMeta } = page;
      if (!q) return true;
      return (
        pageMeta.title.toLowerCase().includes(q) ||
        pageMeta.type.toLowerCase().includes(q)
      );
    });

    next.sort((a, b) => {
      if (sortBy === "priority") {
        return b.score - a.score;
      }
      if (sortBy === "az") {
        return a.page.pageMeta.title.localeCompare(b.page.pageMeta.title);
      }
      if (sortBy === "created") {
        return (
          new Date(b.page.pageMeta.createdAt).getTime() -
          new Date(a.page.pageMeta.createdAt).getTime()
        );
      }
      return (
        new Date(b.page.pageMeta.lastUpdatedAt || b.page.pageMeta.createdAt).getTime() -
        new Date(a.page.pageMeta.lastUpdatedAt || a.page.pageMeta.createdAt).getTime()
      );
    });

    return next;
  }, [pagesStore.pages, query, settingsData.nsfwContent, sortBy]);

  const typeStats = useMemo(() => {
    return pagesStore.pages.reduce<Record<string, number>>((acc, { pageMeta }) => {
      acc[pageMeta.type] = (acc[pageMeta.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [pagesStore.pages]);

  return (
    <div className="library-list">
      <div className="library-list-topbar">
        <div className="title-wrap">
          <h1>Library</h1>
          <p>
            {pagesStore.pages.length} pages
            {query.trim() ? ` • ${filteredPages.length} matches` : ""}
          </p>
        </div>

        <div className="list-actions">
          <Button
            variant="ghost"
            onClick={async () => {
              await pageActions.pages.load().catch((err) => console.error("[err]: ", err));
            }}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setActiveTabTypeAndView("create", "picker")}
          >
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

      <div className="library-list-items">
        {filteredPages.length === 0 && <EmptyState title="No pages found" description="Try a different search or create a new page." className="library-list-empty" />}

        {filteredPages.map(({ page, score, reasons }) => (
          <button
            key={page.pageMeta.id}
            className="library-list-item"
            onClick={async () => {
              pageActions.activePage.set({
                pageMeta: page.pageMeta,
                normalizedSnapshots: page.normalizedSnapshots,
              });
              setActiveTabTypeAndView("library", "detail");
            }}
          >
            <div className="library-list-item-head">
              <h2>{page.pageMeta.title}</h2>
              <Badge className="type-chip">{page.pageMeta.type}</Badge>
            </div>

            <div className="library-list-item-priority">
              <Badge
                title={reasons.map((reason) => `- ${reason}`).join("\n")}
                aria-label={`Priority score ${score}`}
              >
                Score {score}
              </Badge>
            </div>

            <div className="library-list-item-meta">
              <span>Snapshots: {page.normalizedSnapshots.ids.length}</span>
              <span>Tags: {page.pageMeta.tags.length}</span>
            </div>

            <div className="library-list-item-footer">
              <span>
                Updated:{" "}
                {new Date(
                  page.pageMeta.lastUpdatedAt || page.pageMeta.createdAt,
                ).toLocaleDateString()}
              </span>
              <span>
                Created: {new Date(page.pageMeta.createdAt).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default LibraryList;
