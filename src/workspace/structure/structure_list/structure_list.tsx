import "./structure_list.scss";
import { useMemo, useState } from "react";
import { useTags } from "@/hooks/useTag";
import { priorityBand } from "../helper";
import { Tag } from "@/types/tag";

type StructureListProps = {
  onSelectTag: (tag: Tag) => void;
};

const StructureList = ({ onSelectTag }: StructureListProps) => {
  const { tagsData, tagsActions } = useTags();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "label">("priority");

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = tagsData.tags.filter((tag) => {
      if (!q) return true;
      return (
        tag.label.toLowerCase().includes(q) ||
        tag.description.toLowerCase().includes(q)
      );
    });

    next.sort((a, b) => {
      if (sortBy === "label") return a.label.localeCompare(b.label);
      return b.priority - a.priority;
    });

    return next;
  }, [query, sortBy, tagsData.tags]);

  if (tagsData.loading) {
    return <p>Loading tags...</p>;
  }

  if (tagsData.error) {
    return <p className="error">Error loading tags: {String(tagsData.error)}</p>;
  }

  return (
    <div className="structure_list">
      <h3>Structure List</h3>

      <div className="structure_list_controls">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by label or description"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "priority" | "label")}
        >
          <option value="priority">Sort: Priority</option>
          <option value="label">Sort: Label A-Z</option>
        </select>
      </div>

      <ul className="tag-list">
        {filteredTags.length === 0 && (
          <p className="hint">No tags found. Create one or adjust search.</p>
        )}

        {filteredTags.map((tag) => (
          <li
            key={tag.id}
            className="tag-item"
            data-priority={priorityBand(tag.priority)}
            onClick={() => onSelectTag(tag)}
          >
            <span className="label">{tag.label}</span>

            <span className="priority">{tag.priority.toFixed(2)}</span>

            <button
              className="delete"
              onClick={(e) => {
                e.stopPropagation();
                tagsActions.remove(tag.id);
              }}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StructureList;
