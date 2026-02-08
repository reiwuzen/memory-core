import { useMemoryStore } from "@/store/useMemory.store"
import { MemoryItemService } from "@/service/memoryItem.service";
export const useMemory = () => {
    const {memory,setMemory,resetMemory,reloadMemory,} =useMemoryStore();
const {createMemoryItem, addNewNodeToExistingMemoryItem,deleteMemoryItem,loadAllMemoryItems} =MemoryItemService();
    const memoryActions = {
        memory: {

            setToNull:()=> setMemory(null),
            set:setMemory,
            resetMemory,
            reload: reloadMemory
        },
         memoryItem: {
            create: createMemoryItem,
            addNode: addNewNodeToExistingMemoryItem,
            delete:deleteMemoryItem
         }
    }
    return{
        memory,
        memoryActions,
        loadAllMemoryItems
    }
}