import { useState } from "react";
import "./templateForm.scss";
import type { PageTemplate } from "@/types/template";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";
import type { PageType } from "@/types/page";
type TemplateFormProps = {
  selectedTemplate: PageTemplate;
};

const memoryTypes: PageType[] = ["diary", "fact", "event", "generic"];

const TemplateForm = ({ selectedTemplate }: TemplateFormProps) => {
  const { pageActions } = useLibrary();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [title, setTitle] = useState(selectedTemplate.initialTitle);
  const [type, setType] = useState(selectedTemplate.pageType);

  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="templateForm">
      <header className="templateForm-header">
        <h1>Create memory</h1>
        <p>
          This will create a new {selectedTemplate.pageType as string} page
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
              className={`custom-select-trigger ${open ? "open" : ""}`}
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
                await pageActions.page.create(title, type);
                await pageActions.pages.load();
                setActiveTabTypeAndView("library", "list");
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
