import { useActiveTab } from "@/hooks/useActiveTab";
import "./libraryItem.scss";
import "@reiwuzen/blocky-react/styles.css";

import { useTags } from "@/hooks/useTag";
import { useEffect, useMemo, useRef, useState } from "react";
import { Editor, type EditorHandle } from "@reiwuzen/blocky-react";
import { type AnyBlock } from "@reiwuzen/blocky";
import { toast } from "sonner";

import { useLibrary } from "@/hooks/useLibrary";
import { Snapshot } from "@/types/snapshot";
import { normalizeVersionedPage } from "@/helper/normaliseVersionedPage";

const LibraryItem = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { setActiveTabView } = useActiveTab();
  const { tagsData } = useTags();

  const activePage = pagesStore.activePage;
  console.log(activePage);
  const { pageMeta, normalizedSnapshots } = activePage;

  const { byId, ids } = normalizedSnapshots;

  const editorRef = useRef<EditorHandle>(null);
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  const [editable, setEditable] = useState(false);
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

  const saveSnapshot = async () => {
    const blocks = editorRef.current?.serialize();
    if (!blocks) throw new Error("Editor not ready");

    setEditable(false);

    const res = await pageActions.page.createNewSnapshot(
      pageMeta,
      JSON.stringify(blocks),
    );

    res.match(
      (vp) => pageActions.activePage.set(normalizeVersionedPage(vp)),
      (err) => {
        throw err;
      },
    );
  };

  const deleteAndExit = async () => {
    const res = await pageActions.page.delete(pageMeta.id);

    if (!res.ok) {
      const err = res.error ? String(res.error) : "Failed to delete page";
      throw new Error(err);
    }

    setActiveTabView("list");
  };

  return (
    <article className="page-snapshot">
      <div className="page-snapshot-accessory-bar">
        {!editable ? (
          <button
            className="page-snapshot-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setEditable(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        ) : (
          <button
            className="page-snapshot-save-btn"
            onClick={() =>
              toast.promise(saveSnapshot(), {
                loading: "Saving node",
                success: "Node saved successfully",
                error: (err) => `Failed to save: ${err}`,
              })
            }
          >
            <svg
              width="800px"
              height="800px"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.1716 1C18.702 1 19.2107 1.21071 19.5858 1.58579L22.4142 4.41421C22.7893 4.78929 23 5.29799 23 5.82843V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H18.1716ZM4 3C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21L5 21L5 15C5 13.3431 6.34315 12 8 12L16 12C17.6569 12 19 13.3431 19 15V21H20C20.5523 21 21 20.5523 21 20V6.82843C21 6.29799 20.7893 5.78929 20.4142 5.41421L18.5858 3.58579C18.2107 3.21071 17.702 3 17.1716 3H17V5C17 6.65685 15.6569 8 14 8H10C8.34315 8 7 6.65685 7 5V3H4ZM17 21V15C17 14.4477 16.5523 14 16 14L8 14C7.44772 14 7 14.4477 7 15L7 21L17 21ZM9 3H15V5C15 5.55228 14.5523 6 14 6H10C9.44772 6 9 5.55228 9 5V3Z"
                fill="#0F0F0F"
              />
            </svg>
          </button>
        )}

        <button
          className="page-snapshot-delete-btn"
          onClick={(e) => {
            e.stopPropagation();

            toast.promise(deleteAndExit(), {
              loading: "Deleting...",
              success: "Deleted successfully",
              error: (e) => e.message,
            });
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            color="black"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>

        <button
          className="page-snapshot-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowSnapshotsList((v) => !v);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"
          fill="currentColor"
            color="black"
            stroke="currentColor">
            <path
              d="M83.4,16.6c-6.8,0-12.4,5.3-13,12c-4,0.3-8.1,2.5-10.7,5.1c-2.4,2.4-4,5.4-4.8,8.2c-1.3-0.8-2.8-1.3-4.5-1.3
    c-3,0-5.6,1.5-7.2,3.9V16.6C43.2,9.7,37.6,4,30.7,4c-6.9,0-12.5,5.6-12.5,12.5c0,6.7,5.3,12.2,12,12.5v42.2c-6.7,0.3-12,5.8-12,12.5
    c0,6.9,5.6,12.5,12.5,12.5c6.9,0,12.5-5.6,12.5-12.5c0-4-1.9-7.5-4.8-9.8c0.7-3.1,2.2-6.2,4.8-8.9c3.9-3.9,9.4-6.4,14.8-6.6
    c0.6,6.5,6.1,11.5,12.8,11.5c7.1,0,12.9-5.8,12.9-12.9C96.3,22.4,90.5,16.6,83.4,16.6z"
            />
          </svg>
        </button>

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
                      setViewSnapshot(s);
                      setShowSnapshotsList(false);
                    }}
                  >
                    <span>{s.comment}</span>
                    <time>{new Date(s.createdAt).toLocaleString()}</time>
                    {headSnapshot?.id === s.id && <span>head</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          ref={addTagBtnRef}
          className="page-snapshot-add_tag-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowTagPicker((p) => !p);
          }}
        >
          Add Tag
        </button>

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
                    const res = await pageActions.page.addTag(
                      pageMeta.id,
                      t.id,
                    );

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
      </div>

      <header className="page-snapshot__header">
        <h1 className="page-snapshot__title">{pageMeta.title}</h1>

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
              {t.label}
            </li>
          ))
        ) : (
          <li className="no-tags">No Tags available</li>
        )}
      </ul>

      <section className="page-snapshot__content">
        <Editor
          key={viewSnapshot?.id ?? ""}
          ref={editorRef}
          initialBlocks={parsedBlocks}
          editable={editable}
        />
      </section>
    </article>
  );
};

export default LibraryItem;
