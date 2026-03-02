import { Block } from "@reiwuzen/blocky";

export const DEFAULT_PARAGRAPH_BLOCK: Block<'paragraph'> = {
    id: crypto.randomUUID()
    , type:'paragraph'
    ,
    meta: {},
    content: [{
        type:'text',
        text:''
    }]
}