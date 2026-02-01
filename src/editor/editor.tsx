import "./editor.scss";
import { useEffect, useRef } from "react";
import BlockMenu from "./blockMenu";
import { useEditorZen } from "./useEditorZen";
import { focusEnd } from "@/helper/focusEl";

const Editor = () => {
  const pendingFocusId = useRef<string | null>(null);
  const {
    blocks,
    openMenu,
    setOpenMenu,
    insertBlockAfter,
    changeBlockType,
    deleteBlock,
    updateBlockContent,
    onClickBlockMenuItem
  } = useEditorZen();
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const blockMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    if (!pendingFocusId.current) return;
    console.log("getting el")
    const el = blockRefs.current.get(pendingFocusId.current);
    if (el) {
      focusEnd(el);
    }

    pendingFocusId.current = null;
  }, [blocks]);
  useEffect(() => {
    const handleDropDownClose = (e: MouseEvent) => {
      if (
        blockMenuRef.current &&
        !blockMenuRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleDropDownClose);
    return () => document.removeEventListener("mousedown", handleDropDownClose);
  }, [blocks]);

  /* ---------- DOM refs (local, NOT in store) ---------- */

  return (
    <div className="editor">
      <div className="editable-content">
        {blocks.map((block) => (
          <div className="editor-block-row" key={block.id}>
            {/* ---------- CONTROLS ---------- */}
            <div
              className={`editor-block-controls ${openMenu ? "active" : ""}`}
            >
              <button
                className="add"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu({blockId: block.id, type: 'add'});
                }}
              >
                +
              </button>

              <button
                className="drag"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu({blockId: block.id , type: 'more'});
                }}
              >
                ⋮⋮
              </button>
            </div>

            {/* ---------- CONTENT ---------- */}
            <div
              className="editor-block-content"
              contentEditable
              suppressContentEditableWarning
              data-type={block.type}
              ref={(el) => {
                if (el) blockRefs.current.set(block.id, el);
              }}
              onKeyDown={(e) => {
                /* Backspace → delete empty block */
                if (
                  e.key === "Backspace" &&
                  block.content === "" &&
                  blocks.length > 1
                ) {
                  e.preventDefault();
                  pendingFocusId.current = deleteBlock(block.id);

                  return;
                }

                /* Enter → insert block */
                if (e.key === "Enter") {
                  e.preventDefault();
                  pendingFocusId.current = insertBlockAfter(
                    block.id,
                    block.type,
                  );
                }
              }}
              onInput={(e) =>
                updateBlockContent(block.id, e.currentTarget.textContent ?? "")
              }
            />

            {/* ---------- MENU ---------- */}
            {openMenu?.blockId === block.id && (
              <BlockMenu
                block={block}
                openMenuProp={openMenu}
                blockMenuRef={blockMenuRef as React.RefObject<HTMLDivElement>}
                onClose={() => setOpenMenu(null)}
                onClick_BlockMenuItem={(changeToType)=>{
                  
                  pendingFocusId.current = onClickBlockMenuItem(block,changeToType )
                  console.log(`pending focus id: ${pendingFocusId.current} `)
                }}
                
                
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
