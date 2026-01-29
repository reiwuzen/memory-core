import { useState } from "react";
import "./templateForm.scss";
import { MemoryTemplate } from "@/memory/template";
import { MemoryItemService } from "@/service/memoryItemService";
import { invoke } from "@tauri-apps/api/core";
type TemplateFormProps = {
  selectedTemplate: MemoryTemplate;
};

const TemplateForm = ({ selectedTemplate }: TemplateFormProps) => {
  const { createMemoryItem } = MemoryItemService();
  const [title, setTitle] = useState(selectedTemplate.initialTitle);
  const [type, setType] = useState(selectedTemplate.memoryType);

  return (
    <div className="templateForm">
      <header className="templateForm-header">
        <h1>Create memory</h1>
        <p>
          This will create a new {selectedTemplate.memoryType as string} page
        </p>
      </header>

      <div className="templateForm-form">
        <div className="form-field">
          <label htmlFor="templateFormTitle">Title</label>
          <input
            id="templateFormTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="templateFormType">Type</label>
          <select
            id="templateFormType"
            value={type}
            disabled={selectedTemplate.id !== "generic"}
          >
            <option value="Diary">Diary</option>
            <option value="Fact">Fact</option>
            <option value="Event">Event</option>
            <option value="Generic">Generic</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            className="primary"
            disabled={!title.trim()}
            onClick={async () => {
              const { memoryItem, memoryNode } = createMemoryItem(
                title as string,
                type,
              );
              try {
                await invoke("save_memory_item", {
                  memoryItem: memoryItem,
                });

                await invoke("save_memory_node", {
                  memoryNode: memoryNode,
                });
              } catch (err) {
                console.error("Failed to save memory:", err);
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
