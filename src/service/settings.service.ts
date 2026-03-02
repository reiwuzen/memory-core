import { Result } from "@reiwuzen/result";
import { invoke } from "@tauri-apps/api/core";

export const SettingsService = () => {
  /**
   * Clears all application data.
   * Safe to call multiple times.
   */
  const clearData = async (): Promise<Result<never, string>> => {
    try {
      await invoke<void>("clear_data");
      return Result.Ok(undefined as never)
      
    } catch (err) {
      return Result.Err(err)
    }
  };
  return {
    clearData,
  };
};
