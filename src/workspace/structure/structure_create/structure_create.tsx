import { Tag } from "@/types/tag";
import { useState } from "react";
import { v7 as uuidv7 } from "uuid";
import "./structure_create.scss";

type StructureCreateProps = {
  onCreate: (tag: Tag) => void;
};

const StructureCreate = ({ onCreate }: StructureCreateProps) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0.1);

  const handleCreate = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const tag: Tag = {
      id: uuidv7(),
      label: trimmedLabel,
      description: description.trim(),
      priority,
    };

    onCreate(tag);

    // reset form
    setLabel("");
    setDescription("");
    setPriority(0);
  };

  return (
    <div className="structure_create">
      <h3>Create New Tag</h3>

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


      <button
        onClick={handleCreate}
        disabled={!label.trim()}
      >
        Create
      </button>
    </div>
  );
};

export default StructureCreate;
