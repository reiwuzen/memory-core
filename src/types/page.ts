import { Snapshot } from "./snapshot"

export type PageType = | 'diary' | 'fact' | 'event' | 'generic'
export type PageMeta = {
    readonly id: string
    type: PageType
    headSnapshotId: string 
    title: string
    readonly createdAt: string
    tags: string[]
    bookId: string
    parentPageId: string
    lastOpenedAt: string
    lastUpdatedAt: string
}

export type VersionedPage = {
    pageMeta:PageMeta,
    headSnapshot: Snapshot,
    snapshots: Snapshot[]
}