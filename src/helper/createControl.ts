export const createControl = <T>(
  state: T,
  setter: (v: T) => void,
  preset: Record<string, () => void>
) => ({
  get state() {
    return state;
  },
  preset
});
