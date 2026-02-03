import { selectedMemory } from '@/memory/schema'
import { useActiveTab } from '@/hooks/useActiveTab'
import { useEditorZen } from '@/editor/useEditorZen'
import './memory_space_item.scss'

type MemorySpaceItemProps = {
    memory: selectedMemory
}

const MemorySpaceItem = ({ memory }: MemorySpaceItemProps) => {

// const [editable, setEditable] = useState(false);
const {switchActiveTab} =useActiveTab();
const { setMemory} = useEditorZen();
  const { active_node: activeNode,  } = memory;
  return (
    <article className="memory-node"
   
    >
      <button className='memory-node-edit-btn'
      onClick={(e)=>{
        e.stopPropagation();
        // e.preventDefault();
      {memory && setMemory({mI: memory.memory_item, selectedMN: memory.active_node})}
      switchActiveTab('editor')

    }}
      >Edit</button>
      <header className="memory-node__header">
        <h1 className="memory-node__title">
          {activeNode.title}
        </h1>

        <time className="memory-node__timestamp">
          {new Date(activeNode.created_at).toLocaleString()}
        </time>
      </header>

      <section className="memory-node__content" 
      // onClick={()=>{}}
      >
        {/* <Editor content={activeNode.content} editable={editable}></Editor> */}
        {activeNode.content_string}
      </section>

    </article>
  )
}

export default MemorySpaceItem
