import "./templatePicker.scss";
import { useMemo, useState } from "react";
import type { CreateTemplate } from "@/types/template";
import { CREATE_TEMPLATES } from "@/constants/templates";

type TemplatePickerProps = {
  onSelectTemplate: (template: CreateTemplate) => void;
};

const TemplatePicker = ({ onSelectTemplate }: TemplatePickerProps) => {
  const [createType, setCreateType] = useState<"page" | "book" | null>(null);

  const filteredTemplates = useMemo(
    () => CREATE_TEMPLATES.filter((template) => template.createType === createType),
    [createType],
  );

  return (
    <div className="templatePicker">
      <header className="templatePicker-header">
        <h1>Create Memory</h1>
        <p>
          Start by selecting memory kind, then choose a template type.
        </p>
      </header>

      {!createType && (
        <div className="templatePicker-wrapper">
          <button
            className="template-card"
            onClick={() => setCreateType("page")}
          >
            <h3>Page</h3>
            <p>Create a standalone page from a template.</p>
          </button>
          <button
            className="template-card"
            onClick={() => setCreateType("book")}
          >
            <h3>Book</h3>
            <p>Create a book and optionally attach existing pages.</p>
          </button>
        </div>
      )}

      {createType && (
        <>
          <div className="templatePicker-actions">
            <button
              className="ghost"
              onClick={() => setCreateType(null)}
            >
              Back
            </button>
          </div>

          <div className="templatePicker-section">
            <h2>{createType === "book" ? "Book Templates" : "Page Templates"}</h2>
            <div className="templatePicker-wrapper">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  className="template-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <h3>{template.label}</h3>
                  <p>{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplatePicker;
