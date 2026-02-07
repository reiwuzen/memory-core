import "./editor.scss";
import { useEffect, useRef, useState } from "react";
import { useEditorZen } from "./useEditorZen";
import { focusEnd } from "@/helper/focusEl";
import { AnyBlock, Block } from "@/types/editor";
import { widenBlock } from "@/helper/widenBlock";
import BlockMenu from "./blockMenu";

const Editor = () => {
  const blockMenuRef = useRef<HTMLDivElement>(null);

  const pendingFocusId = useRef<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { blocks, insertBlockAfter, deleteBlock, updateBlockContent, openMenu, setOpenMenu,editable } =
    useEditorZen();

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

      if (text.length === 0 && blocks.length > 1 && block.type !== "code") {
        e.preventDefault();
        pendingFocusId.current = deleteBlock(block.id);
      }

      return;
    }
    if (e.key === 'Enter' && e.shiftKey){
      return
    }
    if(e.key === 'Enter' && block.type === 'code' && e.ctrlKey || e.metaKey){
      e.preventDefault();

      pendingFocusId.current = insertBlockAfter(block.id, block.type);
      return
    }
    if (e.key === "Enter") {
      if (block.type === "code"){
        // console.log('enter inside code block')
        return}
        e.preventDefault();

      pendingFocusId.current = insertBlockAfter(block.id, block.type);
      
    }
  };

  /* ---------- Content sync ---------- */
  const handleInput = (e: React.FormEvent<HTMLDivElement>, block: Block) => {
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
        {blocks.map((block) => (
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
                  )
                    pendingFocusId.current = insertBlockAfter(block.id, type);
                }}
                onChangeBlockType={(type) => {
                  // optional: implement later
                  // pendingFocusId.current = replaceBlock(block.id, type);
                }}
              />
            )}
            {/* ---------- GUTTER ---------- */}
            <div className="editor-block-controls">
              <button className="add" onClick={() => {setOpenMenu({blockId: block.id, mode: 'add'})}}>
                +
              </button>
              <button className="drag">⋮⋮</button>
            </div>

            {/* ---------- CONTENT ---------- */}
            <div
              className={`editor-block editor-${block.type}`}
              contentEditable= {editable}
              suppressContentEditableWarning
              data-type={block.type}
              ref={(el) => {
                if (el) blockRefs.current.set(block.id, el);
              }}
              onKeyDown={(e) => handleKeyDown(e, widenBlock(block))}
              onInput={(e) => handleInput(e, block)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
