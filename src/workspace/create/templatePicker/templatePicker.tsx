import "./templatePicker.scss";
import { MEMORY_TEMPLATES } from "@/memory/template";
import type { MemoryTemplate } from "@/memory/template";

type TemplatePickerProps = {
  onSelectTemplate: (template: MemoryTemplate) => void;
};

const TemplatePicker = ({ onSelectTemplate }: TemplatePickerProps) => {
  return (
    <div className="templatePicker">
      <header className="templatePicker-header">
        <h1>Create a memory</h1>
        <p>Choose how you want to begin. Select a template to initialize a new data structure in the current branch.</p>
      </header>

      <div className="templatePicker-wrapper">
        {MEMORY_TEMPLATES.map((template) => (
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
  );
};

export default TemplatePicker;
