import "./create.scss";
import { useState } from "react";
import TemplatePicker from "./templatePicker/templatePicker";
import TemplateForm from "./templateForm/templateForm";
import type { CreateTemplate } from "@/types/template";

const Create = () => {
  const [createSteps, setCreateSteps] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<CreateTemplate | null>(null);

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
        <TemplateForm
          selectedTemplate={selectedTemplate}
          onBack={() => {
            setCreateSteps(1);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default Create;
