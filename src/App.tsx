import { invoke } from "@tauri-apps/api/core";
import "./App.scss";
import "./styles/themes.css";
import "./components/ui/ui.scss";
import Navbar from "./components/navbar/navbar";
import Workspace from "./workspace/workspace";
import { useEffect } from "react";
import { useSettings } from "./hooks/useSettings";
import type { Theme } from "./types/settings";
import CommandPalette from "./components/commandPalette/commandPalette";

const THEME_CLASSES = ["theme-light", "theme-dark", "theme-blueGrey"] as const;
const CUSTOM_THEME_CLASSES = [
  "theme-custom",
  "theme-custom-aurora",
  "theme-custom-forest",
  "theme-custom-sunset",
  "theme-custom-citrus",
] as const;

const applyTheme = (theme: Theme, customThemeVariant: "aurora" | "forest" | "sunset" | "citrus") => {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES, ...CUSTOM_THEME_CLASSES);

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "theme-dark" : "theme-light");
    return;
  }

  if (theme === "light" || theme === "dark" || theme === "blueGrey" || theme === "custom") {
    if (theme === "custom") {
      root.classList.add(`theme-custom-${customThemeVariant}`);
      return;
    }
    root.classList.add(`theme-${theme}`);
    return;
  }

  // Keep a sane fallback for unsupported theme presets.
  root.classList.add("theme-dark");
};

function App() {
  const { settingsData } = useSettings();

  useEffect(() => {
    invoke("page_store_dir");
  }, []);

  useEffect(() => {
    applyTheme(settingsData.theme, settingsData.customThemeVariant);

    if (settingsData.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system", settingsData.customThemeVariant);

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [settingsData.customThemeVariant, settingsData.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", settingsData.reduceAnimations);
  }, [settingsData.reduceAnimations]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("performance-mode", settingsData.performanceMode);
  }, [settingsData.performanceMode]);

  return (
    <main className="container">
      <Navbar />
      <Workspace />
      <CommandPalette />
    </main>
  );
}

export default App;
