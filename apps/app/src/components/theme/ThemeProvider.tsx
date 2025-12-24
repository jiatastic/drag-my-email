"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeSetting = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "reb-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyThemeToDocument(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
}

type ThemeContextValue = {
  /** User preference persisted in localStorage. */
  theme: ThemeSetting;
  /** Effective theme after resolving `system`. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeSetting) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Initialize theme from localStorage on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        return;
      }
    } catch {
      // Ignore storage errors (e.g. private mode).
    }
    setThemeState("system");
  }, []);

  // Apply theme to <html> and keep it in sync.
  useEffect(() => {
    const nextResolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(nextResolved);
    applyThemeToDocument(nextResolved);

    if (theme !== "system") return;

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const onChange = () => {
      const sys = getSystemTheme();
      setResolvedTheme(sys);
      applyThemeToDocument(sys);
    };

    // Safari support
    if ("addEventListener" in media) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    // @ts-expect-error legacy API
    media.addListener(onChange);
    // @ts-expect-error legacy API
    return () => media.removeListener(onChange);
  }, [theme]);

  const setTheme = (next: ThemeSetting) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors.
    }
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}


