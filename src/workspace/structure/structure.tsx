import "./structure.scss";
import { useState } from "react";
import StructureList from "./structure_list/structure_list";
import { Tag } from "@/types/tag";
import StructureDetails from "./structure_details/structure_details";
import StructureCreate from "./structure_create/structure_create";
import { useTags } from "@/hooks/useTag";
import { useActiveTab } from "@/hooks/useActiveTab";

const Structure = () => {
  const [tag, setTag] = useState<Tag | null>(null);
  const {activeTab, setActiveTabTypeAndView} = useActiveTab();

  const {  reloadTags: reload,tagsActions } = useTags();
  if(!activeTab) return
  return (
    <div className="structure">
      {activeTab.view === "list" && (
        <StructureList
          onSelectTag={(selectedTag) => {
            setTag(selectedTag);
            setActiveTabTypeAndView('structure',"details");
          }}
        />
      )}
      {activeTab.view === "details" && tag && <StructureDetails tag={tag} onDelete={async(tagToDelete)=>{
        await tagsActions.remove(tagToDelete.id);
        setTag(null);
        await reload();
        setActiveTabTypeAndView('structure',"list");
      }} />}

      {activeTab.view === "add" && (
        <StructureCreate
          onCreate={async (createdTag) => {
            await tagsActions.save(createdTag);
            setTag(null)
            await reload()
            setActiveTabTypeAndView('structure',"list")
            
          }}
        />
      )}
      <button className="onClick_create_structure" onClick={() => setActiveTabTypeAndView('structure','add')}>+</button>
      <button className="onClick_reload_structure" onClick={async () => {await reload(); setActiveTabTypeAndView('structure','list')}}><svg xmlns="http://www.w3.org/2000/svg"
     width="24"
     height="24"
     viewBox="0 0 24 24"
     fill="none"
     stroke="#070707"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">

  <polyline points="23 4 23 10 17 10"></polyline>
  <polyline points="1 20 1 14 7 14"></polyline>
  <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path>

</svg>
</button>
    </div>
  );
};

export default Structure;
