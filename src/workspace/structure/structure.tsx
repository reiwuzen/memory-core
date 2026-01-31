import "./structure.scss";
import { useState } from "react";
import { v7 } from "uuid";
import StructureList from "./structure_list/structure_list";
// import { priorityBand } from "./helper";
import { Tag } from "@/types/tag";
import StructureDetails from "./structure_details/structure_details";
import StructureCreate from "./structure_create/structure_create";
import { useTags } from "@/hooks/useTag";
// import {useTags} from "@/hooks/useTag";

const Structure = () => {
  const [tag, setTag] = useState<Tag | null>(null);
  const [view, setView] = useState<"list" | "details" | "create">("list");

  const { saveTag, reload, removeTag } = useTags();
  return (
    <div className="structure">
      {view === "list" && (
        <StructureList
          onSelectTag={(selectedTag) => {
            setTag(selectedTag);
            setView("details");
          }}
        />
      )}
      {view === "details" && tag && <StructureDetails tag={tag} onDelete={async(tagToDelete)=>{
        await removeTag(tagToDelete.id);
        setTag(null);
        await reload();
        setView("list");
      }} />}

      {view === "create" && (
        <StructureCreate
          onCreate={async (createdTag) => {
            await saveTag(createdTag);
            setTag(null)
            await reload()
            setView("list")
            
          }}
        />
      )}
      <button className="onClick_create_structure" onClick={() => setView("create")}>+</button>
      <button className="onClick_reload_structure" onClick={async () => await reload()}>RE</button>
    </div>
  );
};

export default Structure;
