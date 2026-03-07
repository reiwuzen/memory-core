// import { useTags } from "@/hooks/useTag";
import type { Tag } from "@/types/tag";
import "./structure_details.scss";

type StructureDetailsProps = {
    tag: Tag;
    onDelete: (tag: Tag)=>void
    onEdit: (tag: Tag) => void
    onBack: () => void
}


const StructureDetails = ({tag, onDelete, onEdit, onBack}: StructureDetailsProps) => {
    
    return (
        <div className="structure_details">
        <h3>Structure Details</h3>
        <p>Tag Label: {tag.label}</p>
        <p>Tag Description: {tag.description}</p>
        <p>Tag Priority: {tag.priority}</p>
        <div className="structure_details_actions">
          <button className="ghost" onClick={onBack}>Back</button>
          <button className="ghost" onClick={()=>onEdit(tag)}>Edit</button>
          <button className="onClick_removeTag_structure_details" onClick={()=>onDelete(tag)}>Delete</button>
        </div>
        </div>
    )
}
export default StructureDetails;
