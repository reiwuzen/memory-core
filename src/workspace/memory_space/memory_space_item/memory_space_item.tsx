import { MemoryNode, selectedMemoryType } from '@/memory/schema'
import './memory_space_item.scss'

type MemorySpaceItemProps = {
    memory: selectedMemoryType
}

const MemorySpaceItem = ({ memory }: MemorySpaceItemProps) => {


  const { active_node: activeNode,  } = memory;
  return (
    <article className="memory-node">

      <header className="memory-node__header">
        <h1 className="memory-node__title">
          {activeNode.title}
        </h1>

        <time className="memory-node__timestamp">
          {new Date(activeNode.created_at).toLocaleString()}
        </time>
      </header>

      <section className="memory-node__content">
        {activeNode.content}
      </section>

    </article>
  )
}

export default MemorySpaceItem
