import { useEffect, useMemo, useState } from "react";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";
import { useSettings } from "@/hooks/useSettings";
import { Input, Modal } from "@/components/ui";
import "./commandPalette.scss";

type ActionItem = {
  id: string;
  label: string;
  keywords: string[];
  run: () => void;
};

const CommandPalette = () => {
  const { setActiveTabTypeAndView } = useActiveTab();
  const { pagesStore, pageActions } = useLibrary();
  const { settingsView } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (pagesStore.pages.length > 0) return;
    pageActions.pages.load().catch(() => {});
  }, [isOpen, pageActions.pages, pagesStore.pages.length]);

  const actions = useMemo<ActionItem[]>(() => {
    return [
      { id: "go-overview", label: "Go to Overview", keywords: ["overview", "home"], run: () => setActiveTabTypeAndView("overview", "list") },
      { id: "go-library", label: "Go to Library", keywords: ["library", "pages"], run: () => setActiveTabTypeAndView("library", "list") },
      { id: "go-create", label: "Create New Page", keywords: ["create", "new", "page"], run: () => setActiveTabTypeAndView("create", "picker") },
      { id: "go-structure", label: "Go to Structure", keywords: ["structure", "map"], run: () => setActiveTabTypeAndView("structure", "list") },
      { id: "go-calendar", label: "Go to Calendar", keywords: ["calendar", "schedule"], run: () => setActiveTabTypeAndView("calendar", "calendar") },
      { id: "open-settings", label: "Open Settings", keywords: ["settings", "preferences"], run: () => settingsView.isOpen.actions.enable() },
    ];
  }, [setActiveTabTypeAndView, settingsView.isOpen.actions]);

  const pages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return pagesStore.pages.slice(0, 6);
    return pagesStore.pages
      .filter(({ pageMeta }) => {
        return (
          pageMeta.title.toLowerCase().includes(normalizedQuery) ||
          pageMeta.type.toLowerCase().includes(normalizedQuery) ||
          pageMeta.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
      })
      .slice(0, 8);
  }, [pagesStore.pages, query]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return actions;
    return actions.filter((action) => {
      return (
        action.label.toLowerCase().includes(normalizedQuery) ||
        action.keywords.some((keyword) => keyword.includes(normalizedQuery))
      );
    });
  }, [actions, query]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <Modal title="Command Palette" isOpen={isOpen} onClose={close}>
      <div className="command-palette">
        <Input
          autoFocus
          value={query}
          placeholder="Type a command or search page titles..."
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Command search"
        />
        <div className="command-list-wrap" aria-label="Command results">
          <h3>Actions</h3>
          {filteredActions.map((action) => (
            <button
              key={action.id}
              className="command-item"
              onClick={() => {
                action.run();
                close();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="command-list-wrap" aria-label="Page results">
          <h3>Pages</h3>
          {pages.length === 0 ? (
            <p className="command-empty">No pages match this query.</p>
          ) : (
            pages.map((page) => (
              <button
                key={page.pageMeta.id}
                className="command-item"
                onClick={() => {
                  pageActions.activePage.set(page);
                  setActiveTabTypeAndView("library", "detail");
                  close();
                }}
              >
                {page.pageMeta.title}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CommandPalette;
