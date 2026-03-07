import { useActiveTab } from "@/hooks/useActiveTab";
import "./libraryItem.scss";
import "@reiwuzen/blocky-react/styles.css";

import { useTags } from "@/hooks/useTag";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor, type EditorHandle } from "@reiwuzen/blocky-react";
import { type AnyBlock } from "@reiwuzen/blocky";

import { useLibrary } from "@/hooks/useLibrary";
import { Snapshot } from "@/types/snapshot";
import { normalizeVersionedPage } from "@/helper/normaliseVersionedPage";
import { appToast, Badge } from "@/components/ui";
import { rankPage } from "@/helper/rankPages";

const flattenText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenText)
      .join(" ");
  }
  return "";
};

const LibraryItem = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { setActiveTabView } = useActiveTab();
  const { tagsData } = useTags();

  const activePage = pagesStore.activePage;
  const { pageMeta, normalizedSnapshots } = activePage;
  const { score, reasons } = useMemo(() => rankPage(activePage), [activePage]);

  const { byId, ids } = normalizedSnapshots;

  const editorRef = useRef<EditorHandle>(null);
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedContentRef = useRef("");

  const [editable, setEditable] = useState(false);
  const [editorResetSeed, setEditorResetSeed] = useState(0);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showSnapshotsList, setShowSnapshotsList] = useState(false);

  const headSnapshot = useMemo(
    () =>
      pageMeta.headSnapshotId ? byId.get(pageMeta.headSnapshotId) : undefined,
    [pageMeta.headSnapshotId, byId],
  );

  const [viewSnapshot, setViewSnapshot] = useState<Snapshot | null>(
    headSnapshot ?? byId.get(ids[0]) ?? null,
  );

  useEffect(() => {
    setViewSnapshot(headSnapshot ?? byId.get(ids[0]) ?? null);
  }, [headSnapshot, byId, ids]);

  const parsedBlocks = useMemo(() => {
    if (!viewSnapshot) return undefined;
    return JSON.parse(viewSnapshot.contentJson) as AnyBlock[];
  }, [viewSnapshot]);

  const contentText = useMemo(() => {
    if (!parsedBlocks) return "";
    return parsedBlocks
      .map((block) => flattenText((block as { content?: unknown }).content))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }, [parsedBlocks]);

  const wordCount = useMemo(() => {
    if (!contentText) return 0;
    return contentText.split(" ").filter(Boolean).length;
  }, [contentText]);

  const charCount = contentText.length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const pageTagIds = useMemo(() => new Set(pageMeta.tags), [pageMeta.tags]);

  const assignedTags = useMemo(
    () => tagsData.tags.filter((tag) => pageTagIds.has(tag.id)),
    [tagsData.tags, pageTagIds],
  );

  const unassignedTags = useMemo(
    () => tagsData.tags.filter((tag) => !pageTagIds.has(tag.id)),
    [tagsData.tags, pageTagIds],
  );

  useEffect(() => {
    const handleTagPicker = (e: MouseEvent) => {
      if (
        tagPickerRef.current &&
        !tagPickerRef.current.contains(e.target as Node) &&
        !addTagBtnRef.current?.contains(e.target as Node)
      ) {
        setShowTagPicker(false);
      }
    };

    document.addEventListener("mousedown", handleTagPicker);

    return () => {
      setEditable(false);
      document.removeEventListener("mousedown", handleTagPicker);
    };
  }, []);

  useEffect(() => {
    lastSavedContentRef.current = JSON.stringify(parsedBlocks ?? []);
  }, [parsedBlocks, viewSnapshot?.id]);

  const saveSnapshot = useCallback(async (options?: { exitEdit?: boolean; content?: string }) => {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    try {
      const blocks = options?.content ? null : editorRef.current?.serialize();
      const serialized = options?.content ?? JSON.stringify(blocks ?? []);

      if (serialized === lastSavedContentRef.current) {
        return false;
      }

      if (options?.exitEdit ?? true) {
        setEditable(false);
      }

      const res = await pageActions.page.createNewSnapshot(
        pageMeta,
        serialized,
      );

      res.match(
        (vp) => pageActions.activePage.set(normalizeVersionedPage(vp)),
        (err) => {
          throw err;
        },
      );
      lastSavedContentRef.current = serialized;
      return true;
    } finally {
      isSavingRef.current = false;
    }
  }, [pageActions, pageMeta]);

  const handleSave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    (async () => {
      try {
        const didSave = await saveSnapshot({ exitEdit: true });
        if (didSave) appToast.success("Page saved successfully");
        else appToast.info("No changes to save");
      } catch (err) {
        appToast.error(`Failed to save: ${err}`);
      }
    })();
  }, [saveSnapshot]);

  const discardDraft = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setEditable(false);
    setEditorResetSeed((v) => v + 1);
    appToast.info("Draft discarded");
  }, []);

  const deleteAndExit = useCallback(async () => {
    const res = await pageActions.page.delete(pageMeta.id);

    if (!res.ok) {
      const err = res.error ? String(res.error) : "Failed to delete page";
      throw new Error(err);
    }

    setActiveTabView("list");
  }, [pageActions, pageMeta.id, setActiveTabView]);

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      if (!editable) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        discardDraft();
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [discardDraft, editable, handleSave]);

  useEffect(() => {
    if (autosaveEnabled) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, [autosaveEnabled]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleEditorInput = useCallback(() => {
    if (!editable || !autosaveEnabled) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      const blocks = editorRef.current?.serialize();
      if (!blocks) return;

      const content = JSON.stringify(blocks);

      try {
        await saveSnapshot({ exitEdit: false, content });
      } catch (err) {
        appToast.error(`Autosave failed: ${err}`);
      }
    }, 1200);
  }, [autosaveEnabled, editable, saveSnapshot]);

  return (
    <article className="page-snapshot">
      <header className="page-snapshot-topbar">
        <div className="topbar-left">
          <button
            className="toolbar-btn ghost"
            onClick={() => setActiveTabView("list")}
            title="Back to library"
          >
            Back
          </button>
          <span className="status-badge">{editable ? "Editing" : "Read only"}</span>
          {editable && (
            <span className="status-note">Press Ctrl/Cmd+S to save, Esc to discard</span>
          )}
        </div>

        <div className="page-snapshot-accessory-bar">
          {!editable ? (
            <button
              className="toolbar-btn primary"
              onClick={(e) => {
                e.stopPropagation();
                setEditable(true);
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button className="toolbar-btn success" onClick={handleSave}>
                Save
              </button>
              <button className="toolbar-btn ghost" onClick={discardDraft}>
                Discard
              </button>
            </>
          )}

          {editable && (
            <button
              className={`toolbar-btn ${autosaveEnabled ? "success" : "ghost"}`}
              onClick={() => setAutosaveEnabled((v) => !v)}
              title="Autosave with 1.2s debounce"
            >
              Autosave: {autosaveEnabled ? "On" : "Off"}
            </button>
          )}

          <button
            className="toolbar-btn ghost"
            onClick={(e) => {
              e.stopPropagation();
              setShowSnapshotsList((v) => !v);
              setShowTagPicker(false);
            }}
          >
            Snapshots
          </button>

          <button
            ref={addTagBtnRef}
            className="toolbar-btn ghost"
            onClick={(e) => {
              e.stopPropagation();
              setShowTagPicker((p) => !p);
              setShowSnapshotsList(false);
            }}
          >
            Add Tag
          </button>

          <button
            className="toolbar-btn danger"
            onClick={(e) => {
              e.stopPropagation();

              appToast.promise(deleteAndExit(), {
                loading: "Deleting...",
                success: "Deleted successfully",
                error: (err) => err.message,
              });
            }}
          >
            Delete
          </button>
        </div>

        {showSnapshotsList && (
          <div className="snapshots">
            <div className="snapshots__header">
              <span>View Snapshots</span>
            </div>

            <ul className="snapshots__list">
              {ids.map((id) => {
                const s = byId.get(id);
                if (!s) return null;

                return (
                  <li
                    key={s.id}
                    className={s.id === viewSnapshot?.id ? "active" : ""}
                    onClick={() => {
                      setEditable(false);
                      setViewSnapshot(s);
                      setShowSnapshotsList(false);
                    }}
                  >
                    <span>{s.comment || "Snapshot"}</span>
                    <time>{new Date(s.createdAt).toLocaleString()}</time>
                    {headSnapshot?.id === s.id && <span>head</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showTagPicker && (
          <div ref={tagPickerRef} className="tag-picker">
            <div className="tag-picker__header">
              <span>Tags</span>
            </div>

            <ul className="tag-picker__list">
              {unassignedTags.length === 0 && (
                <li className="tag-picker__empty">No tags found</li>
              )}

              {unassignedTags.map((t) => (
                <li
                  key={t.id}
                  className="tag-picker__item"
                  onClick={async () => {
                    const res = await pageActions.page.addTag(pageMeta.id, t.id);

                    res.match(
                      (updatedMeta) =>
                        pageActions.activePage.set({
                          pageMeta: updatedMeta,
                          normalizedSnapshots,
                        }),
                      (err) => console.error("[TagNotAdded]", err),
                    );

                    setShowTagPicker(false);
                  }}
                >
                  {t.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <header className="page-snapshot__header">
        <div className="title-wrap">
          <h1 className="page-snapshot__title">{pageMeta.title}</h1>
          <span className="page-type">{pageMeta.type}</span>
          <Badge
            title={reasons.map((reason) => `- ${reason}`).join("\n")}
            aria-label={`Priority score ${score}`}
          >
            Score {score}
          </Badge>
        </div>

        <div className="page-stats">
          <div className="stat">
            <span className="label">Words</span>
            <strong>{wordCount}</strong>
          </div>
          <div className="stat">
            <span className="label">Characters</span>
            <strong>{charCount}</strong>
          </div>
          <div className="stat">
            <span className="label">Read time</span>
            <strong>{readingMinutes} min</strong>
          </div>
          <div className="stat">
            <span className="label">Snapshots</span>
            <strong>{ids.length}</strong>
          </div>
        </div>

        <div className="page-snapshot__timestamp">
          <div>
            <span className="label">Page created</span>
            <time dateTime={pageMeta.createdAt}>
              {new Date(pageMeta.createdAt).toLocaleString()}
            </time>
          </div>

          {headSnapshot && (
            <div>
              <span className="label">Page updated</span>
              <time dateTime={headSnapshot.createdAt}>
                {new Date(headSnapshot.createdAt).toLocaleString()}
              </time>
            </div>
          )}

          {viewSnapshot && (
            <div>
              <span className="label">Snapshot created</span>
              <time dateTime={viewSnapshot.createdAt}>
                {new Date(viewSnapshot.createdAt).toLocaleString()}
              </time>
            </div>
          )}
        </div>
      </header>

      <ul className="page-snapshot__tags">
        {assignedTags.length > 0 ? (
          assignedTags.map((t) => (
            <li className="tag" key={t.id}>
              <span>{t.label}</span>
              <button
                className="tag-remove"
                onClick={async () => {
                  const res = await pageActions.page.removeTag(pageMeta.id, t.id);

                  res.match(
                    (updatedMeta) =>
                      pageActions.activePage.set({
                        pageMeta: updatedMeta,
                        normalizedSnapshots,
                      }),
                    (err) => console.error("[TagNotRemoved]", err),
                  );
                }}
                title={`Remove ${t.label}`}
              >
                x
              </button>
            </li>
          ))
        ) : (
          <li className="no-tags">No tags available</li>
        )}
      </ul>

      <section
        className={`page-snapshot__content ${editable ? "is-editing" : ""}`}
        onInputCapture={handleEditorInput}
      >
        <Editor
          key={`${viewSnapshot?.id ?? "empty"}-${editorResetSeed}`}
          ref={editorRef}
          initialBlocks={parsedBlocks ?? []}
          editable={editable}
          placeholder="Start writing..."
        />
      </section>
    </article>
  );
};

export default LibraryItem;
