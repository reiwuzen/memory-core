import { Result } from "@reiwuzen/result";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { PageService } from "./page.service";

export const SettingsService = () => {
  const { loadPages } = PageService();

  /**
   * Clears all application data.
   * Safe to call multiple times.
   */
  const clearData = async (): Promise<Result<void, string>> => {
    try {
      await invoke<void>("clear_data");
      return Result.Ok(undefined)
      
    } catch (err) {
      return Result.Err(err)
    }
  };

  const getPageStoreDir = async (): Promise<Result<string, string>> => {
    try {
      const path = await invoke<string>("page_store_dir");
      return Result.Ok(path);
    } catch (err) {
      return Result.Err(String(err));
    }
  };

  const openStorageFolder = async (): Promise<Result<void, string>> => {
    try {
      const pathResult = await getPageStoreDir();
      if (!pathResult.ok) return Result.Err(pathResult.error);
      await openPath(pathResult.value);
      return Result.Ok(undefined);
    } catch (err) {
      return Result.Err(String(err));
    }
  };

  const exportMemoryDatabase = async (): Promise<Result<string, string>> => {
    try {
      const pagesResult = await loadPages();
      if (!pagesResult.ok) {
        return Result.Err(String(pagesResult.error));
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        count: pagesResult.value.length,
        pages: pagesResult.value,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `zensys-memory-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      return Result.Ok(anchor.download);
    } catch (err) {
      return Result.Err(String(err));
    }
  };

  return {
    clearData,
    getPageStoreDir,
    openStorageFolder,
    exportMemoryDatabase,
  };
};
