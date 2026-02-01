import "./blockTypeMenu.scss";
import { Block, useEditorZen } from "./useEditorZen";

import { BlockType,BLOCK_ITEMS as ITEMS } from "@/types/editor";

type Props = {
  selectedBlock: Block;
  onSelect: (type: BlockType) => void;
};

const BlockTypeMenu = ({ selectedBlock, onSelect }: Props) => {
  const { changeBlockType, setOpenMenu } = useEditorZen();
  return (
    <div className="block-type-menu">
      {ITEMS.map((item) => (
        <button
          key={item.type}
          className={`menu-item
            ${selectedBlock.type === item.type ? "active" : ""}
            ${item.disabled ? "disabled" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault(); // editor focus safety
            if (!item.disabled) {
              changeBlockType(selectedBlock.id, item.type);
              setOpenMenu(null);
              onSelect(item.type);
            }
          }}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
          {selectedBlock.type === item.type && <span className="check">✓</span>}
          {item.type === "page-in" && <span className="arrow">›</span>}
        </button>
      ))}
    </div>
  );
};

export default BlockTypeMenu;
