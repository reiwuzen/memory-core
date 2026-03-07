import { Tag } from "@/types/tag";
import { useEffect, useState } from "react";
import { v7 as uuidv7 } from "uuid";
import "./structure_create.scss";

type StructureCreateProps = {
  onCreate: (tag: Tag) => void;
  initialTag?: Tag | null;
  onCancel?: () => void;
};

const StructureCreate = ({ onCreate, initialTag = null, onCancel }: StructureCreateProps) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0.1);
  const isEditMode = !!initialTag;

  useEffect(() => {
    if (!initialTag) {
      setLabel("");
      setDescription("");
      setPriority(0.1);
      return;
    }
    setLabel(initialTag.label);
    setDescription(initialTag.description);
    setPriority(initialTag.priority);
  }, [initialTag]);

  const handleCreate = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const tag: Tag = {
      id: initialTag?.id ?? uuidv7(),
      label: trimmedLabel,
      description: description.trim(),
      priority,
    };

    onCreate(tag);

    if (!isEditMode) {
      setLabel("");
      setDescription("");
      setPriority(0.1);
    }
  };

  return (
    <div className="structure_create">
      <h3>{isEditMode ? "Edit Tag" : "Create New Tag"}</h3>

      <label htmlFor="label">Title</label>
      <input
        id="label"
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
      />

      <label htmlFor="description">Description</label>
      <input
        id="description"
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <label htmlFor="priority">Priority</label>
      <input
      id="priority"
      type="range"
      min={-1}
      max={1}
      step={0.01}
      value={priority}
      onChange={e => setPriority(Number(e.target.value))}
      />

      <p className="priority_value">{priority}</p>

      <div className="structure_create_actions">
        {onCancel ? (
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button
          onClick={handleCreate}
          disabled={!label.trim()}
        >
          {isEditMode ? "Save Changes" : "Create"}
        </button>
      </div>
    </div>
  );
};

export default StructureCreate;
