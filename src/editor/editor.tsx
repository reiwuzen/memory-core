import "./editor.scss";
import { useEffect, useMemo, useRef } from "react";
import { useEditorZen } from "./useEditorZen";
import { focusEnd } from "@/helper/focusEl";
import { AnyBlock, Block } from "@/types/editor";
import { widenBlock } from "@/helper/widenBlock";
import BlockMenu from "./blockMenu";
import { toast } from "sonner";

const Editor = () => {
  const blockMenuRef = useRef<HTMLDivElement>(null);

  const pendingFocusId = useRef<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hydratedBlocks = useRef(new Set<string>());

  const {
    blocks,
    insertBlockAfter,
    deleteBlock,
    updateBlockContent,
    updateBlockMeta,
    openMenu,
    setOpenMenu,
    editable,
  } = useEditorZen();
  const renderBlocks = useMemo(
    () =>
      blocks.map((b) => {
        const rb = widenBlock(b);
        const isTL = rb.type !== "code" && rb.type !== "equation";
        return {
          block: rb,
          isTextLike: isTL,
          initialText: isTL
            ? rb.content
                .filter((v) => v.type === "text")
                .map((v) => v.text ?? "")
                .join("")
            : "",
        };
      }),
    [blocks],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        blockMenuRef.current &&
        !blockMenuRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------- Focus management ---------- */
  useEffect(() => {
    if (!pendingFocusId.current) return;

    const el = blockRefs.current.get(pendingFocusId.current);
    if (el) focusEnd(el);

    pendingFocusId.current = null;
  }, [blocks]);

  /* ---------- Keyboard handling ---------- */
  const handleKeyDown = (e: React.KeyboardEvent, block: AnyBlock) => {
    if (e.key === "Backspace") {
      const el = blockRefs.current.get(block.id);
      if (!el) return;

      const text = el.textContent ?? "";
      updateBlockContent(block.id, [
        {
          type: "text",
          text,
        },
      ]);

      if (text.length === 0 && blocks.length > 1 && block.type !== "code") {
        e.preventDefault();
        pendingFocusId.current = deleteBlock(block.id);
      }

      return;
    }
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }
    if (
      (e.key === "Enter" && block.type === "code" && e.ctrlKey) ||
      e.metaKey
    ) {
      e.preventDefault();

      pendingFocusId.current = insertBlockAfter(block.id, block.type);
      return;
    }
    if (e.key === "Enter") {
      if (block.type === "code") {
        // console.log('enter inside code block')
        return;
      }
      e.preventDefault();

      pendingFocusId.current = insertBlockAfter(block.id, block.type);
    }
  };

  /* ---------- Content sync ---------- */
  const handleInput = (e: React.FormEvent<HTMLSpanElement>, block: Block) => {
    if (block.type === "code") {
      updateBlockContent(block.id, {
        text: e.currentTarget.textContent ?? "",
      });
      return;
    }

    updateBlockContent(block.id, [
      {
        type: "text",
        text: e.currentTarget.textContent ?? "",
      },
    ]);
  };

  return (
    <div className="editor">
      <div className="editable-content">
        {renderBlocks.map(({ block,  initialText }) => (
          <div className="editor-block-row" key={block.id}>
            {openMenu?.blockId === block.id && (
              <BlockMenu
                block={widenBlock(block)}
                mode={openMenu.mode}
                onClose={() => setOpenMenu(null)}
                onAddBlock={(type) => {
                  if (
                    type !== "bullet-list" &&
                    type !== "number-list" &&
                    type !== "todo"
                  ) {
                    pendingFocusId.current = insertBlockAfter(block.id, type);
                  } else {
                    const nId = insertBlockAfter(block.id, "list-item");
                    updateBlockMeta(nId, {
                      style: type,
                      depth: 0,
                      checked: false,
                    });
                    pendingFocusId.current = nId;
                  }
                }}
                onChangeBlockType={(
                  // _type
                ) => {
                  
                  // optional: implement later
                  // pendingFocusId.current = replaceBlock(block.id, type);
                }}
              />
            )}
            {/* ---------- GUTTER ---------- */}
            <div className="editor-block-controls">
              <button
                className="add"
                onClick={() => {
                  setOpenMenu({ blockId: block.id, mode: "add" });
                }}
              >
                +
              </button>
              <button className="drag">⋮⋮</button>
            </div>

            {/* ---------- CONTENT ---------- */}
            <div
              className={`editor-block editor-${block.type}`}
              contentEditable={false}
              data-type={block.type}
              data-meta-type={
                block.type === "list-item" ? block.meta.style : ""
              }
              data-meta-depth={
                block.type === "list-item" ? block.meta.depth : ""
              }
              data-meta-checked={
                block.type === "list-item" ? block.meta.checked : ""
              }
              ref={(el) => {
                if (!el) return;
                blockRefs.current.set(block.id, el);
              }}
            >
              {block.type === "list-item" && block.meta.style === "todo" && (
                <span
                  className="todo-checkbox"
                  contentEditable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editable === true) {
                      updateBlockMeta(block.id, {
                        ...block.meta,
                        checked: !block.meta.checked,
                      });
                    } else {
                      toast.info("Set memory-item to be editable");
                    }
                  }}
                />
              )}

              <span
                className="editor-text"
                contentEditable={editable}
                suppressContentEditableWarning
                ref={(el) => {
                  if (!el) return;
                  if (hydratedBlocks.current.has(block.id)) return;
                  el.textContent = initialText;
                  hydratedBlocks.current.add(block.id);
                }}
                onInput={(e) => handleInput(e, block)}
                onKeyDown={(e) => handleKeyDown(e, widenBlock(block))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
