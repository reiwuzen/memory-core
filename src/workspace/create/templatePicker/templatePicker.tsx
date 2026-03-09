import "./templatePicker.scss";
import type { PageTemplate } from "@/types/template";
import { PAGES_TEMPLATES } from "@/constants/templates";

type TemplatePickerProps = {
  onSelectTemplate: (template: PageTemplate) => void;
};

const TemplatePicker = ({ onSelectTemplate }: TemplatePickerProps) => {
  const bookTemplates: PageTemplate[] = [
    {
      id: "book-generic",
      label: "Generic",
      description: "Create generic pages inside a book",
      pageType: "generic",
      initialTitle: "Book - Generic",
    },
    {
      id: "book-diary",
      label: "Diary",
      description: "Create diary pages inside a book",
      pageType: "diary",
      initialTitle: "Book - Diary",
    },
    {
      id: "book-fact",
      label: "Facts",
      description: "Create fact pages inside a book",
      pageType: "fact",
      initialTitle: "Book - Fact",
    },
    {
      id: "book-event",
      label: "Event",
      description: "Create event pages inside a book",
      pageType: "event",
      initialTitle: "Book - Event",
    },
  ];

  return (
    <div className="templatePicker">
      <header className="templatePicker-header">
        <h1>Create a Page</h1>
        <p>
          Choose how you want to begin. Select a template to initialize a new
          data structure in the current branch.
        </p>
      </header>

      <div className="templatePicker-section">
        <h2>Pages</h2>
        <div className="templatePicker-wrapper">
          {PAGES_TEMPLATES.map((template) => (
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

      <div className="templatePicker-section">
        <h2>Book</h2>
        <div className="templatePicker-wrapper">
          {bookTemplates.map((template) => (
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
    </div>
  );
};

export default TemplatePicker;
