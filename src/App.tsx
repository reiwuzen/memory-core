import { invoke } from "@tauri-apps/api/core";
import "./App.scss";
import Navbar from "./components/navbar/navbar";
import Workspace from "./workspace/workspace";
import { useEffect } from "react";
import { useSettings } from "./hooks/useSettings";
import type { Theme } from "./types/settings";
import CommandPalette from "./components/commandPalette/commandPalette";

const THEME_CLASSES = ["theme-light", "theme-dark", "theme-blueGrey"] as const;

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "theme-dark" : "theme-light");
    return;
  }

  if (theme === "light" || theme === "dark" || theme === "blueGrey") {
    root.classList.add(`theme-${theme}`);
    return;
  }

  // Keep a sane fallback for unsupported theme presets like "custom".
  root.classList.add("theme-dark");
};

function App() {
  const { settingsData } = useSettings();

  useEffect(() => {
    invoke("page_store_dir");
  }, []);

  useEffect(() => {
    applyTheme(settingsData.theme);

    if (settingsData.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [settingsData.theme]);

  return (
    <main className="container">
      <Navbar />
      <Workspace />
      <CommandPalette />
    </main>
  );
}

export default App;
