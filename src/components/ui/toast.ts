import { toast } from "sonner";

export const appToast = {
  success: (message: string) => toast.success(message),
  info: (message: string) => toast.info(message),
  error: (message: string) => toast.error(message),
  promise: toast.promise,
};
