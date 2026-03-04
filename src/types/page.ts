import { NormalizedSnapshots } from "@/helper/normalizeSnapshots"
import { Snapshot } from "./snapshot"

export type PageType = | 'diary' | 'fact' | 'event' | 'generic'
export type PageMeta = {
    readonly id: string
    type: PageType
    headSnapshotId: string | null
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
    snapshots: Snapshot[]
}

export type NormalizedVersionedPage = {
    pageMeta:PageMeta,
    normalizedSnapshots: NormalizedSnapshots
}