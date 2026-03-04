import { v7 } from "uuid"
import { invoke } from "@tauri-apps/api/core"
import { createBlock } from "@reiwuzen/blocky"
import { Result } from "@reiwuzen/result"

import {
  PageMeta,
  VersionedPage,
  PageType,
  NormalizedVersionedPage
} from "@/types/page"

import { Snapshot } from "@/types/snapshot"
import { DEFAULT_PARAGRAPH_BLOCK } from "@/constants/content"
import { normalizeSnapshots } from "@/helper/normalizeSnapshots"

const now = () => new Date().toISOString()

async function invokeSafe<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<Result<T, unknown>> {
  try {
    const value = await invoke<T>(command, args)
    return Result.Ok(value)
  } catch (err) {
    return Result.Err(err)
  }
}

export const PageService = () => {

  const createPage = async (
    title: string,
    type: PageType
  ): Promise<Result<NormalizedVersionedPage, unknown>> => {

    const pageId = v7()
    const time = now()

    const pageMeta: PageMeta = {
      id: pageId,
      title,
      type,
      createdAt: time,
      headSnapshotId: null,
      bookId: null,
      parentPageId: null,
      lastOpenedAt: time,
      lastUpdatedAt: time,
      tags: []
    }

    const res = await invokeSafe<VersionedPage>("create_page", { pageMeta })

    return res.map(vp => ({
      pageMeta: vp.pageMeta,
      normalizedSnapshots: normalizeSnapshots(vp.snapshots)
    }))
  }

  const createPageWithInitialSnapshot = async (
    title: string,
    type: PageType
  ): Promise<Result<VersionedPage, unknown>> => {

    const pageId = v7()
    const snapshotId = v7()
    const time = now()

    const pageMeta: PageMeta = {
      id: pageId,
      title,
      type,
      createdAt: time,
      headSnapshotId: snapshotId,
      bookId: null,
      parentPageId: null,
      lastOpenedAt: time,
      lastUpdatedAt: time,
      tags: []
    }

    const snapshot: Snapshot = {
      id: snapshotId,
      pageId,
      parentSnapshotId: null,
      createdAt: time,
      contentJson: JSON.stringify([
        createBlock("paragraph").match(
          b => b,
          () => DEFAULT_PARAGRAPH_BLOCK
        )
      ])
    }

    return invokeSafe("create_page_with_initial_snapshot", {
      pageMeta,
      snapshot
    })
  }

  const createNewSnapshotOfPage = async (
    pageMeta: PageMeta,
    contentJson: string
  ): Promise<Result<VersionedPage, unknown>> => {

    const snapshotId = v7()
    const time = now()

    const updatedPageMeta: PageMeta = {
      ...pageMeta,
      headSnapshotId: snapshotId,
      lastUpdatedAt: time
    }

    const snapshot: Snapshot = {
      id: snapshotId,
      pageId: pageMeta.id,
      parentSnapshotId: null,
      createdAt: time,
      contentJson
    }

    return invokeSafe("create_new_snapshot_of_page", {
      pageMeta: updatedPageMeta,
      snapshot
    })
  }

  const deletePage = (pageId: string) =>
    invokeSafe<void>("delete_page", { pageId })

  const loadPages = () =>
    invokeSafe<VersionedPage[]>("load_all_pages")

  const reloadPage = (pageId: string) =>
    invokeSafe<VersionedPage>("load_page_details", { pageId })

  const upsertTagOnPage = (
    pageId: string,
    tagId: string
  ) =>
    invokeSafe<PageMeta>("upsert_tag_on_page", { pageId, tagId })

  const deleteTagFromPage = (
    pageId: string,
    tagId: string
  ) =>
    invokeSafe<PageMeta>("delete_tag_from_page", { pageId, tagId })

  return {
    createPage,
    createPageWithInitialSnapshot,
    createNewSnapshotOfPage,
    deletePage,
    loadPages,
    reloadPage,
    upsertTagOnPage,
    deleteTagFromPage
  }
}