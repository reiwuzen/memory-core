import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettings.store";

const notificationsEnabled = () => useSettingsStore.getState().notifications;

export const appToast = {
  success: (message: string) => {
    if (!notificationsEnabled()) return;
    toast.success(message);
  },
  info: (message: string) => {
    if (!notificationsEnabled()) return;
    toast.info(message);
  },
  error: (message: string) => {
    if (!notificationsEnabled()) return;
    toast.error(message);
  },
  promise: toast.promise,
};
