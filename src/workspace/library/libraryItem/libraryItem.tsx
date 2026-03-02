import { useActiveTab } from "@/hooks/useActiveTab";
import "./libraryItem.scss";
import "../../../../../../../local/blocky-react/src/styles.css";
import { useTags } from "@/hooks/useTag";
import { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "../../../../../../../local/blocky-react/src/editor";
import { AnyBlock } from "@reiwuzen/blocky";
import { toast } from "sonner";

import { useLibrary } from "@/hooks/useLibrary";
// import { areBlocksSemanticallyEqual } from "@/helper/compareTwoBlocks";

const LibraryItem = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { setActiveTabView } = useActiveTab();
  const { tagsData } = useTags();
  const { headSnapshot, pageMeta } = pagesStore.activePage;
  const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
  const [blocks, setBlocks] = useState<AnyBlock[]>();
  const [editable, setEditable] = useState<boolean>(false);

  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  const pageTagIds = useMemo(() => new Set(pageMeta.tags), [pageMeta.tags]);

  const assignedTags = useMemo(
    () => tagsData.tags.filter((tag) => pageTagIds.has(tag.id)),
    [tagsData.tags, pageTagIds],
  );

  const unassignedTags = useMemo(
    () => tagsData.tags.filter((tag) => !pageTagIds.has(tag.id)),
    [tagsData.tags, pageTagIds],
  );

  const saveResolverRef = useRef<{
    resolve: () => void;
    reject: (e: unknown) => void;
  } | null>(null);

  useEffect(() => {
    const handleTagPicker = (e: MouseEvent) => {
      if (
        tagPickerRef.current &&
        !tagPickerRef.current.contains(e.target as Node)
        && !addTagBtnRef.current.contains(e.target as Node)
      )
        setShowTagPicker(false);
    };
    
    document.addEventListener("mousedown", handleTagPicker);
    return () => {
      setEditable(false);
      document.removeEventListener("mousedown", handleTagPicker);
    };
  }, [showTagPicker]);
  useEffect(() => {
  const b: AnyBlock[] = JSON.parse(headSnapshot.contentJson);
  setBlocks(b);
}, [headSnapshot.contentJson]);

  const handleSave = async (freshBlocks: AnyBlock[]) => {
    setBlocks(freshBlocks);
    try {
      await pageActions.page.createNewSnapshot(
        pagesStore.activePage.pageMeta,
        JSON.stringify(freshBlocks),
      );
      await pageActions.activePage.reload(headSnapshot.pageId);
      saveResolverRef.current?.resolve();
    } catch (e) {
      saveResolverRef.current?.reject(e);
    } finally {
      saveResolverRef.current = null;
    }
  };

  const saveSnapshot = () => {
    return new Promise<void>((resolve, reject) => {
      saveResolverRef.current = { resolve, reject };
      setEditable(false); // triggers onChange → handleSave
    });
  };

  const deleteAndExit = async () => {
    const res = await pageActions.page.delete(headSnapshot.pageId);

    if (res.ok !== true) {
      throw new Error(res.error ?? "Failed to delete memory Item");
    }

    setActiveTabView("list");
  };

  // console.log(JSON.parse(headNode.content_json))
  return (
    <article className="page-snapshot">
      <div className="page-snapshot-accessory-bar">
        {!editable ? (
          <button
            className="page-snapshot-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              // e.preventDefault();
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
            onClick={async () => {
              // const oldBlocks: AnyBlock[] = JSON.parse(
              //   headSnapshot.contentJson,
              // );
              // const bool = areBlocksSemanticallyEqual(
              //   oldBlocks,
              //   blocks,
              // );
              // if (bool) {
              //   setEditable(false);
              //   toast.warning(
              //     "The content is still same, please change something",
              //   );
              //   return;
              // }
              toast.promise(saveSnapshot(), {
                loading: "Saving node",
                success: "Node saved successfully",
                error: (err) => `Failed to save: ${err}`,
              });
            }}
          >
            <svg
              width="800px"
              height="800px"
              viewBox="0 0 24 24"
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
          onClick={async (e) => {
            e.stopPropagation();
            toast.promise(deleteAndExit(), {
              loading: "Deleting...",
              success: "Delete successfully",
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
        ref={addTagBtnRef}
          className="page-snapshot-add_tag-btn"
          onClick={async (e) => {
            e.stopPropagation();
            setShowTagPicker(p=>!p);
            // const ok = await addTagToNode(headNode.memory_id,headNode.node_id,)
          }}
        >
          Add Tag
        </button>
        {!!showTagPicker && (
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
                    await (
                      await pageActions.page.addTag(
                        pagesStore.activePage.pageMeta.id,
                        t.id,
                      )
                    ).match(
                      () => {},
                      (error) => console.log(`[TagNotAdded]: ${error}`),
                    );
                    setShowTagPicker(false);
                    (
                      await pageActions.activePage.reload(headSnapshot.pageId)
                    ).inspectErr((e) => console.log("[reload] err: ", e));
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

        <time className="page-snapshot__timestamp">
          {new Date(headSnapshot.createdAt).toLocaleString()}
        </time>
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
      <section
        className="page-snapshot__content"
        // onClick={()=>{}}
      >
        {blocks && (
          <Editor
            key={headSnapshot.id}
            initialBlocks={blocks}
            onChange={handleSave}
            editable={editable}
          />
        )}
      </section>
    </article>
  );
};

export default LibraryItem;
