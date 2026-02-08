import { Result } from "@/types/result";
import { invoke } from "@tauri-apps/api/core";

export const SettingsService = () => {
  /**
   * Clears all application data.
   * Safe to call multiple times.
   */
  const clearData = async (): Promise<Result<never, string>> => {
    try {
      await invoke<void>("clear_data");
      return {
        ok: true,
      };
    } catch (err) {
      return {
        ok: false,
        error: String(err),
      };
    }
  };
  return {
    clearData,
  };
};
