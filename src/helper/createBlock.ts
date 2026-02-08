import { BLOCK_DEFAULT_CONTENT, BLOCK_DEFAULT_META } from "@/constants/editor";
import {
  Block,
  BlockType,

} from "@/types/editor";

export function createBlock<T extends BlockType= BlockType>(type: T): Block<T> {
  return {
    id: crypto.randomUUID(),
    type,
    meta: structuredClone(BLOCK_DEFAULT_META[type]),
    content: structuredClone(BLOCK_DEFAULT_CONTENT[type]),
  };
}
