import { useState } from "react";
import "./templateForm.scss";
import { MemoryTemplate } from "@/memory/template";
import { MemoryType } from "@/memory/schema";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useMemory } from "@/hooks/useMemory";
type TemplateFormProps = {
  selectedTemplate: MemoryTemplate;
};

const memoryTypes: MemoryType[] = ["Diary", "Fact", "Event", "Generic"];

const TemplateForm = ({ selectedTemplate }: TemplateFormProps) => {
  const {memoryActions} =useMemory();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [title, setTitle] = useState(selectedTemplate.initialTitle);
  const [type, setType] = useState(selectedTemplate.memoryType);

  const [open, setOpen] = useState<boolean>(false);

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
          <label>Type</label>

          <div
            className={`custom-select ${
              selectedTemplate.id !== "generic" ? "disabled" : ""
            }`}
          >
            <button
              type="button"
              className="custom-select-trigger"
              disabled={selectedTemplate.id !== "generic"}
              onClick={() => setOpen((prev) => !prev)}
            >
              <span>{type}</span>
              <span className="chevron">▾</span>
            </button>

            {open && (
              <div className="custom-select-dropdown">
                {memoryTypes.map((t) => (
                  <div
                    key={t}
                    className={`custom-select-option ${
                      type === t ? "active" : ""
                    }`}
                    onClick={() => {
                      setType(t);
                      setOpen(false);
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            className="primary"
            disabled={!title.trim()}
            onClick={async () => {
              try {
                await memoryActions.memoryItem.create(title, type);
                setActiveTabTypeAndView("memory_space", "list");
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
