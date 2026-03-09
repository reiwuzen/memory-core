import { PageType } from "./page"

export type Book = {
    id: string,
    title: string,
    createdAt: string
    type: PageType
}
export type BookType = PageType;