import { useState } from "react";
import "./blockMenu.scss";
import BlockTypeMenu from "./blockTypeMenu";
import TextColorMenu from "./textColorMenu";
import { Block } from "./useEditorZen";
import { BLOCK_ITEMS, BlockType } from "@/types/editor";

type BlockMenuProps = {
  block: Block; 
  openMenuProp: {blockId: string, type : null | 'add' | 'more'} | null
  onClose: () => void;
  blockMenuRef: React.RefObject<HTMLDivElement>;
  onClick_BlockMenuItem: (changeToType: BlockType) => void
};

const BlockMenu = ({
  block,
  openMenuProp,
  onClose,
  blockMenuRef,
 
  onClick_BlockMenuItem
}: BlockMenuProps) => {
  const [blockTypeMenuToggle, setBlockTypeMenuToggle] = useState(false);
  const [textColorMenuToggle, setTextColorMenuToggle] = useState(false);

  if (openMenuProp?.type === "add") {
    return (
      <div
        ref={blockMenuRef}
        className="blockMenu"
        onMouseDown={(e) => e.stopPropagation()} // keep menu open
      >
        <div className="menu">
          <div className="menu-section">Basic blocks</div>
{
  BLOCK_ITEMS.map((item)=>(
    <div className="menu-item" onClick={()=>onClick_BlockMenuItem(item.type)}>
      <div className={`menu-item-identifier`}>{item.icon}</div>
      <div className="menu-item-label">{item.label}</div>
      {item?.hint && (<div className={`menu-item-hint`}>{item.hint}</div>) }
    </div>
  ))
}
          


        </div>
        <div className="menu-section">Close menu</div>
        <div
          className="menu-item close-menu"
          onMouseDown={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <div className="menu-item-label">Close</div>
          <div className="menu-item-hint">Esc</div>
        </div>
      </div>
    );
  }
  if (openMenuProp?.type === "more") {
  return (
    <div
      ref={blockMenuRef}
      className="blockMenu more"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="more-header">
        <div className="more-title">Block</div>
        <div className="more-subtitle">{block.type}</div>
      </div>

      {/* Tabs */}
      <div className="more-tabs">
        <button
          className={blockTypeMenuToggle ? "active" : ""}
          onClick={() => {
            setBlockTypeMenuToggle(true);
            setTextColorMenuToggle(false);
          }}
        >
          Change
        </button>
        <button
          className={textColorMenuToggle ? "active" : ""}
          onClick={() => {
            setBlockTypeMenuToggle(false);
            setTextColorMenuToggle(true);
          }}
        >
          Color
        </button>
      </div>

      {/* Panel */}
      <div className="more-panel">
        {blockTypeMenuToggle && (
          <BlockTypeMenu
            selectedBlock={block}
            onSelect={(type) => {
              // TODO: wire changeBlockType
            }}
          />
        )}

        {textColorMenuToggle && (
          <TextColorMenu
            active="default"
            onSelect={(color) => {
              // TODO: wire color
            }}
          />
        )}
      </div>
    </div>
  );
}

  return null;
};

export default BlockMenu;
