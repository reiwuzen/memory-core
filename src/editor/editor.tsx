import "./editor.scss";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useEditorZen } from "../hooks/useEditorZen";
import { focusEnd } from "@/helper/focusEl";
import { AnyBlock, Block } from "@/types/editor";
import { widenBlock } from "@/helper/widenBlock";
import BlockMenu from "./blockMenu";
import BlockEditor from "./blockEditor/blockEditor";
import React from "react";

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
    blockActions,
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
    const id = blocks.at(-1).id;
    if (!id) {
      const el = blockRefs.current.get(blocks[0].id);
      focusEnd(el);
    }
    const el = blockRefs.current.get(id);
    focusEnd(el);
  });

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
    // console.log("el: ", el);

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

      pendingFocusId.current = blockActions.insertBlockAfter(
        block.id,
        block.type,
      );
      return;
    }
    if (e.key === "Enter") {
      if (block.type === "code") {
        // console.log('enter inside code block')
        return;
      }
      e.preventDefault();

      pendingFocusId.current = blockActions.insertBlockAfter(
        block.id,
        block.type,
      );
      console.log(block.id, pendingFocusId.current);
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
      {/* <div className="editable-content"> */}
      {renderBlocks.map(({ block, initialText }) => (
        <React.Fragment key={block.id}>
          <BlockEditor
            initialText={initialText}
            pendingFocusId={pendingFocusId}
            block={block}
            handleInput={handleInput}
            handleKeydown={handleKeyDown}
            hydratedBlocks={hydratedBlocks}
            blockRefs={blockRefs}
          />
          {openMenu?.blockId === block.id && (
            <BlockMenu
              blockMenuRef={blockMenuRef}
              block={widenBlock(block)}
              mode={openMenu.mode}
              onClose={() => openMenuActions.setToNull()}
              onAddBlock={(type) => {
                pendingFocusId.current = blockActions.insertBlockAfter(
                  block.id,
                  type,
                );
              }}
              onChangeBlockType={(b) => {
                pendingFocusId.current = b.id;
              }}
            />
          )}
        </React.Fragment>
      ))}
      {/* </div> */}
    </div>
  );
};

export default Editor;
