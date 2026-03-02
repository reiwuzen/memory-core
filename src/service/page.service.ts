import { v7 } from "uuid";
import { invoke } from "@tauri-apps/api/core";
import { createBlock } from "@reiwuzen/blocky";
import { Result } from "@reiwuzen/result";
import { PageMeta, VersionedPage, PageType } from "@/types/page";
import { Snapshot } from "@/types/snapshot";
import { DEFAULT_PARAGRAPH_BLOCK } from "@/constants/content";
export const PageService = () => {
  const createPage = async (
    title: string,
    type: PageType,
  ): Promise<Result<PageMeta>> => {
    const pageId = v7();
    const snapshotId = v7();
    const pageMeta: PageMeta = {
      id: pageId,
      title,
      createdAt: new Date().toISOString(),
      headSnapshotId: snapshotId,
      type: type,
      bookId: null,
      parentPageId: null,
      lastOpenedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      tags: [],
    };
    const snapshot: Snapshot = {
      parentSnapshotId: null,
      id: snapshotId,
      createdAt: new Date().toISOString(),
      pageId,
      contentJson: JSON.stringify([createBlock("paragraph").match(
        b=>b,
        ()=>DEFAULT_PARAGRAPH_BLOCK
      )]),
    };

    try {
      await invoke("create_page_with_initial_snapshot", {
        pageMeta: pageMeta,
        snapshot: snapshot,
      });
      return Result.Ok(pageMeta);
    } catch (error) {
      return Result.Err(error);
    }
  };
  const createNewSnapshotOfPage = async (
    pageMeta: PageMeta,
    contentJson: string,
  ): Promise<Result<[PageMeta, Snapshot]>> => {
    const newSnapshotId = v7();

    const updatedPageMeta = {
      ...pageMeta,
      headSnapshotId: newSnapshotId,
      lastUpdatedAt: new Date().toISOString(),
    };
    const snapshot: Snapshot = {
      pageId: pageMeta.id,
      id: newSnapshotId,
      createdAt: new Date().toISOString(),
      contentJson,
      parentSnapshotId: null,
    };

    try {
      await invoke("create_new_snapshot_of_page", {
        pageMeta: updatedPageMeta,
        snapshot: snapshot,
      });
      return Result.Ok([pageMeta, snapshot]);
    } catch (error) {
      return Result.Err(error);
    }
  };

  const deletePage = async (pageId: string): Promise<Result<never, string>> => {
    try {
      await invoke("delete_page", { pageId });
      // console.log("delete is called and tried")
    } catch (err) {
      // console.log("delete is called and cathced err", err)
      return Result.Err(err);
    }
  };

  const loadPages = async (): Promise<Result<VersionedPage[], string>> => {
    try {
      const value = await invoke<VersionedPage[]>("load_all_pages");
      return Result.Ok(value);
    } catch (error) {
      return Result.Err(error);
    }
  };
  const reloadPage = async (id: string): Promise<Result<VersionedPage>> => {
    try {
      const value = await invoke<VersionedPage>("load_page_details", {
        pageId: id,
      });
      return Result.Ok(value);
    } catch (error) {
      return Result.Err(error instanceof Error ? error.message : String(error));
    }
  };

  const upsertTagOnPage = async (
    pageId: string,
    tagId: string,
  ): Promise<Result<never>> => {
    try {
      await invoke("upsert_tag_on_page", {
        pageId: pageId,
        tagId: tagId,
      });
    } catch (err) {
      return Result.Err(err);
    }
  };

  const deleteTagFromPage= async (pageId:string,tagId:string):Promise<Result<never>> => {
    try {
      await invoke('delete_tag_from_page',{
        pageId:pageId,
        tagId:tagId
      })
    } catch (error) {
      return Result.Err(error)
    }
  }

  
  return {
    createPage,
    createNewSnapshotOfPage,
    deletePage,
    upsertTagOnPage,
    deleteTagFromPage,
    
    loadPages,
    reloadPage,
  };
};
