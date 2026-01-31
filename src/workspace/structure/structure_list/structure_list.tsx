import { useTags } from "@/hooks/useTag";
import { priorityBand } from "../helper";
import { Tag } from "@/types/tag";

type StructureListProps = {
  onSelectTag: (tag: Tag) => void;
};
const StructureList = ({ onSelectTag }: StructureListProps) => {
  const { tags, loading, error, removeTag, reload } = useTags();
  {
    loading && <p>Loading tags...</p>;
  }
  {
    error && (
      <>
        <p className="error">Error loading tags: {String(error)}</p>
      </>
    );
  }
  return (
    <div className="structure_list">
      <h3>Structure List</h3>

      <ul className="tag-list">
        {tags.length === 0 && (
          <p className="hint">
            No tags available. Create one! Using the + button in the top right
            corner.
          </p>
        )}
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="tag-item"
            data-priority={priorityBand(tag.priority)}
            onClick={() => {
              onSelectTag(tag);
            }}
          >
            <span className="label">{tag.label}</span>

            <span className="priority">{tag.priority}</span>

            <button
              className="delete"
              onClick={(e) => {
                e.stopPropagation(); // ← THIS is the key
                removeTag(tag.id);
                reload();
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default StructureList;
