// import { useTags } from "@/hooks/useTag";
import { Tag } from "@/types/tag";

type StructureDetailsProps = {
    tag: Tag;
    onDelete: (tag: Tag)=>void
}



const StructureDetails = ({tag, onDelete}: StructureDetailsProps) => {
    
    return (
        <div className="structure_details">
        <h3>Structure Details</h3>
        <p>Tag Label: {tag.label}</p>
        <p>Tag Description: {tag.description}</p>
        <p>Tag Priority: {tag.priority}</p>
        <button className="onClick_removeTag_structure_details" onClick={()=>onDelete(tag)}>Delete</button>
        </div>
    )
}
export default StructureDetails;