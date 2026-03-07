import "./structure.scss";
import { useState } from "react";
import StructureList from "./structure_list/structure_list";
import { Tag } from "@/types/tag";
import StructureDetails from "./structure_details/structure_details";
import StructureCreate from "./structure_create/structure_create";
import { useTags } from "@/hooks/useTag";
import { useActiveTab } from "@/hooks/useActiveTab";
import { appToast } from "@/components/ui";

const Structure = () => {
  const [tag, setTag] = useState<Tag | null>(null);
  const [draftTag, setDraftTag] = useState<Tag | null>(null);
  const { activeTab, setActiveTabTypeAndView } = useActiveTab();
  const { reloadTags: reload, tagsActions } = useTags();

  if (!activeTab) return null;

  const goToList = async () => {
    await reload();
    setActiveTabTypeAndView("structure", "list");
  };

  return (
    <div className="structure">
      <header className="structure__header">
        <div>
          <p className="structure__kicker">Knowledge Graph</p>
          <h2>Structure</h2>
        </div>
        <div className="structure__actions">
          <button
            className="onClick_reload_structure"
            onClick={async () => {
              await goToList();
              appToast.success("Structure reloaded");
            }}
          >
            Refresh
          </button>
          <button
            className="onClick_create_structure"
            onClick={() => {
              setDraftTag(null);
              setActiveTabTypeAndView("structure", "add");
            }}
          >
            New Tag
          </button>
        </div>
      </header>

      <section className="structure__content">
        {activeTab.view === "list" && (
          <StructureList
            onSelectTag={(selectedTag) => {
              setTag(selectedTag);
              setActiveTabTypeAndView("structure", "details");
            }}
          />
        )}

        {activeTab.view === "details" && tag && (
          <StructureDetails
            tag={tag}
            onBack={() => setActiveTabTypeAndView("structure", "list")}
            onEdit={(tagToEdit) => {
              setDraftTag(tagToEdit);
              setActiveTabTypeAndView("structure", "add");
            }}
            onDelete={async (tagToDelete) => {
              await tagsActions.remove(tagToDelete.id);
              setTag(null);
              await goToList();
              appToast.success("Tag deleted");
            }}
          />
        )}

        {activeTab.view === "add" && (
          <StructureCreate
            initialTag={draftTag}
            onCancel={() => {
              setDraftTag(null);
              setActiveTabTypeAndView("structure", "list");
            }}
            onCreate={async (createdTag) => {
              if (draftTag) {
                await tagsActions.update(createdTag);
                appToast.success("Tag updated");
              } else {
                await tagsActions.save(createdTag);
                appToast.success("Tag created");
              }
              setTag(null);
              setDraftTag(null);
              await goToList();
            }}
          />
        )}
      </section>
    </div>
  );
};

export default Structure;
