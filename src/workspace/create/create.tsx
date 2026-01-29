import "./create.scss";
import { useState } from "react";
import TemplatePicker from "./templatePicker/templatePicker";
import TemplateForm from "./templateForm/templateForm";
import type { MemoryTemplate } from "@/memory/template";

const Create = () => {
  const [createSteps, setCreateSteps] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MemoryTemplate | null>(null);

  return (
    <div className="create">
      {createSteps === 1 && (
        <TemplatePicker
          onSelectTemplate={(template) => {
            setSelectedTemplate(template);
            setCreateSteps(2);
          }}
        />
      )}

      {createSteps === 2 && selectedTemplate && (
        <TemplateForm selectedTemplate={selectedTemplate} />
      )}
    </div>
  );
};

export default Create;
