import { useEffect, useMemo, useState } from "react";
import "./overview.scss";
import { useLibrary } from "@/hooks/useLibrary";
import { formatToLocaleDateTime } from "@/helper/formatToLocaleDateTime";
import { rankPages } from "@/helper/rankPages";
import { Badge, Button, EmptyState, Input, Modal, Skeleton } from "@/components/ui";
import type { NormalizedVersionedPage } from "@/types/page";

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "you", "your",
  "are", "was", "were", "been", "into", "about", "they", "them", "their", "there",
  "then", "than", "when", "what", "where", "which", "while", "will", "would", "should",
  "could", "can", "not", "but", "all", "any", "too", "very", "just", "also", "has",
  "had", "its", "our", "out", "use", "using", "used", "each", "more", "most",
]);

const flattenText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flattenText).join(" ");
  }
  return "";
};

const getPageText = (page: NormalizedVersionedPage) => {
  const { pageMeta, normalizedSnapshots } = page;
  const head = pageMeta.headSnapshotId
    ? normalizedSnapshots.byId.get(pageMeta.headSnapshotId)
    : null;
  const fallbackId = normalizedSnapshots.ids[normalizedSnapshots.ids.length - 1];
  const snapshot = head ?? normalizedSnapshots.byId.get(fallbackId);
  if (!snapshot) return "";

  try {
    const parsed = JSON.parse(snapshot.contentJson) as Array<{ content?: unknown }>;
    return parsed
      .map((block) => flattenText(block.content))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
};

const summarizeText = (rawText: string) => {
  const clean = rawText.replace(/\s+/g, " ").trim();
  if (!clean) {
    return {
      summary: "No written content found in this page yet.",
      highlights: [] as string[],
      words: 0,
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const summary = (sentences.slice(0, 3).join(" ") || clean).slice(0, 520);

  const frequencies = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    .reduce<Record<string, number>>((acc, word) => {
      acc[word] = (acc[word] ?? 0) + 1;
      return acc;
    }, {});

  const highlights = Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return {
    summary,
    highlights,
    words: clean.split(" ").filter(Boolean).length,
  };
};

const OverviewSkeleton = () => {
  return (
    <div className="overview">
      <div className="overview-toolbar">
        <Skeleton className="skeleton-input" />
        <Skeleton className="skeleton-select" />
      </div>
      <div className="overview-scroll">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card skeleton-card">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
};

const Overview = () => {
  const { pagesStore, pageActions } = useLibrary();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "updated" | "opened">("priority");
  const [focusView, setFocusView] = useState<"priority" | "opened" | "updated">("priority");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      await pageActions.pages
        .load()
        .catch((err) => {
          if (!cancelled) setError(String(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranked = rankPages(pagesStore.pages).filter(({ page }) => {
      if (!q) return true;
      return (
        page.pageMeta.title.toLowerCase().includes(q) ||
        page.pageMeta.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    ranked.sort((a, b) => {
      if (sortBy === "updated") {
        return b.page.pageMeta.lastUpdatedAt.localeCompare(a.page.pageMeta.lastUpdatedAt);
      }
      if (sortBy === "opened") {
        return b.page.pageMeta.lastOpenedAt.localeCompare(a.page.pageMeta.lastOpenedAt);
      }
      return b.score - a.score;
    });

    return ranked;
  }, [pagesStore.pages, query, sortBy]);

  const recentOpened = useMemo(() => {
    return [...filtered]
      .sort((a, b) => b.page.pageMeta.lastOpenedAt.localeCompare(a.page.pageMeta.lastOpenedAt))
      .slice(0, 8);
  }, [filtered]);

  const recentUpdated = useMemo(() => {
    return [...filtered]
      .sort((a, b) => b.page.pageMeta.lastUpdatedAt.localeCompare(a.page.pageMeta.lastUpdatedAt))
      .slice(0, 8);
  }, [filtered]);

  const averageScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, item) => sum + item.score, 0);
    return Math.round(total / filtered.length);
  }, [filtered]);

  const focusList = useMemo(() => {
    if (focusView === "opened") return recentOpened;
    if (focusView === "updated") return recentUpdated;
    return filtered.slice(0, 12);
  }, [filtered, focusView, recentOpened, recentUpdated]);

  const focusTitle =
    focusView === "opened"
      ? "Recently Opened"
      : focusView === "updated"
        ? "Recently Updated"
        : "Priority Highlights";

  const selectedPage = useMemo(
    () => (selectedPageId ? pagesStore.pages.find((item) => item.pageMeta.id === selectedPageId) ?? null : null),
    [pagesStore.pages, selectedPageId],
  );

  const selectedSummary = useMemo(() => {
    if (!selectedPage) return null;
    const text = getPageText(selectedPage);
    return summarizeText(text);
  }, [selectedPage]);

  if (loading) return <OverviewSkeleton />;
  if (error) return <div className="overview error">{error}</div>;

  return (
    <section className="overview loaded" aria-label="Overview workspace">
      <header className="overview-head">
        <div>
          <p className="overview-kicker">Memory Dashboard</p>
          <h1>Overview</h1>
          <p className="overview-subtitle">Select any memory card to view an instant content summary.</p>
        </div>
        <div className="overview-summary">
          <div className="summary-card">
            <span>Pages</span>
            <strong>{pagesStore.pages.length}</strong>
          </div>
          <div className="summary-card">
            <span>Visible</span>
            <strong>{filtered.length}</strong>
          </div>
          <div className="summary-card">
            <span>Avg Score</span>
            <strong>{averageScore}</strong>
          </div>
        </div>
      </header>

      <div className="overview-toolbar">
        <Input
          type="search"
          placeholder="Search by title or tag"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search memories"
        />
        <select
          value={sortBy}
          className="ui-select"
          onChange={(event) => setSortBy(event.target.value as "priority" | "updated" | "opened")}
          aria-label="Sort overview"
        >
          <option value="priority">Sort: Priority score</option>
          <option value="updated">Sort: Recently updated</option>
          <option value="opened">Sort: Recently opened</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No memories found"
          description="Create your first page or adjust the search query."
        />
      ) : (
        <div className="overview-block">
          <div className="overview-block-head">
            <h2>{focusTitle}</h2>
            <div className="overview-filters" role="tablist" aria-label="Overview sections">
              <button
                className={focusView === "priority" ? "active" : ""}
                onClick={() => setFocusView("priority")}
                role="tab"
                aria-selected={focusView === "priority"}
              >
                Priority
              </button>
              <button
                className={focusView === "opened" ? "active" : ""}
                onClick={() => setFocusView("opened")}
                role="tab"
                aria-selected={focusView === "opened"}
              >
                Opened
              </button>
              <button
                className={focusView === "updated" ? "active" : ""}
                onClick={() => setFocusView("updated")}
                role="tab"
                aria-selected={focusView === "updated"}
              >
                Updated
              </button>
            </div>
          </div>

          <div className="overview-scroll">
            {focusList.map(({ page, score, reasons }) => (
              <button
                key={page.pageMeta.id}
                className="card"
                onClick={() => setSelectedPageId(page.pageMeta.id)}
              >
                <div className="card-head">
                  <h3>{page.pageMeta.title}</h3>
                  <Badge
                    title={reasons.map((reason) => `- ${reason}`).join("\n")}
                    aria-label={`Priority score ${score}`}
                  >
                    Score {score}
                  </Badge>
                </div>
                <div className="card-meta">
                  <span>{page.pageMeta.type}</span>
                  <span>{page.pageMeta.tags.length} tags</span>
                </div>
                <p>
                  Opened {formatToLocaleDateTime(page.pageMeta.lastOpenedAt || page.pageMeta.createdAt)}
                </p>
                <p>
                  Updated {formatToLocaleDateTime(page.pageMeta.lastUpdatedAt || page.pageMeta.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal
        title={selectedPage?.pageMeta.title ?? "Summary"}
        isOpen={!!selectedPage}
        onClose={() => setSelectedPageId(null)}
        actions={
          <Button variant="ghost" onClick={() => setSelectedPageId(null)}>
            Close
          </Button>
        }
      >
        {selectedPage && selectedSummary ? (
          <div className="overview-summary-modal">
            <p className="overview-summary-text">{selectedSummary.summary}</p>
            <div className="overview-summary-stats">
              <span>{selectedSummary.words} words</span>
              <span>{selectedPage.pageMeta.tags.length} tags</span>
              <span>Updated {formatToLocaleDateTime(selectedPage.pageMeta.lastUpdatedAt || selectedPage.pageMeta.createdAt)}</span>
            </div>
            {selectedSummary.highlights.length > 0 ? (
              <div className="overview-summary-highlights">
                {selectedSummary.highlights.map((highlight) => (
                  <Badge key={highlight}>{highlight}</Badge>
                ))}
              </div>
            ) : (
              <p className="overview-summary-empty">No dominant keywords found yet.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default Overview;
