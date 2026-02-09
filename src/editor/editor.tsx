import "./editor.scss";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useEditorZen } from "../hooks/useEditorZen";
import { focusEnd } from "@/helper/focusEl";
import { AnyBlock, Block } from "@/types/editor";
import { widenBlock } from "@/helper/widenBlock";
import BlockMenu from "./blockMenu";
import { toast } from "sonner";

const Editor = () => {
  const blockMenuRef = useRef<HTMLDivElement>(null);

  const pendingFocusId = useRef<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const hydratedBlocks = useRef(new Set<string>());

  const {
    blocks,
    
    openMenu,
    updateBlock,
    editable,
    openMenuActions,
    blockActions
  } = useEditorZen();

  function useOnTrue(x: boolean, fn: () => void) {
  const prev = useRef(false);

  useEffect(() => {
    if (!prev.current && x) {
      fn();
    }
    prev.current = x;
  }, [x, fn]);
}
  useOnTrue(editable, () => {
    const id = blocks.at(-1).id
    if (!id) {
      const el = blockRefs.current.get(blocks[0].id)
      focusEnd(el)
    }
    const el = blockRefs.current.get(id)
    focusEnd(el)
  })

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
        openMenuActions.setToNull();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useLayoutEffect(() => {
  if (!pendingFocusId.current) return;

  const el = blockRefs.current.get(pendingFocusId.current);
  if (el) {
    focusEnd(el);
  }
  console.log('el: ',el)

  pendingFocusId.current = null;
}, [blocks]);


  const handleKeyDown = (e: React.KeyboardEvent, block: AnyBlock) => {
    if (e.key === "Backspace") {
      const el = blockRefs.current.get(block.id);
      if (!el) return;

      const text = el.textContent ?? "";
      updateBlock.content(block.id, [
        {
          type: "text",
          text,
        },
      ]);

      if (text.length === 0 && blocks.length > 1 && block.type !== "code") {
        e.preventDefault();
        pendingFocusId.current = blockActions.delete(block.id);
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

      pendingFocusId.current = blockActions.insertBlockAfter(block.id, block.type);
      return;
    }
    if (e.key === "Enter") {
      if (block.type === "code") {
        // console.log('enter inside code block')
        return;
      }
      e.preventDefault();

      pendingFocusId.current = blockActions.insertBlockAfter(block.id, block.type);
      console.log(block.id , pendingFocusId.current)
    }
  };

  /* ---------- Content sync ---------- */
  const handleInput = (e: React.FormEvent<HTMLSpanElement>, block: Block) => {
    if (block.type === "code") {
      updateBlock.content(block.id, {
        text: e.currentTarget.textContent ?? "",
      });
      return;
    }

    updateBlock.content(block.id, [
      {
        type: "text",
        text: e.currentTarget.textContent ?? "",
      },
    ]);
  };

  return (
    <div className="editor">
      <div className="editable-content">
        {renderBlocks.map(({ block, initialText }) => (
          <div className="editor-block-row" key={block.id}>
            {openMenu?.blockId === block.id && (
              <BlockMenu
                block={widenBlock(block)}
                mode={openMenu.mode}
                onClose={() => openMenuActions.setToNull()}
                onAddBlock={(type) => {
                  if (
                    type !== "bullet-list" &&
                    type !== "number-list" &&
                    type !== "todo"
                  ) {
                    pendingFocusId.current = blockActions.insertBlockAfter(block.id, type);
                  } else {
                    const nId = blockActions.insertBlockAfter(block.id, "list-item");
                    updateBlock.meta(nId, {
                      style: type,
                      depth: 0,
                      checked: false,
                    });
                    pendingFocusId.current = nId;
                  }
                }}
                onChangeBlockType={() =>
                  // _type
                  {
                    // optional: implement later
                    // pendingFocusId.current = replaceBlock(block.id, type);
                  }
                }
              />
            )}
            {/* ---------- GUTTER ---------- */}
            <div className="editor-block-controls">
              <button
                className="add"
                onClick={() => {
                  openMenuActions.set({ blockId: block.id, mode: "add" });
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
              
            >
              {block.type === "list-item" && block.meta.style === "todo" && (
                <span
                  className="todo-checkbox"
                  contentEditable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editable === true) {
                      updateBlock.meta(block.id, {
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
                   blockRefs.current.set(block.id, el);
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
