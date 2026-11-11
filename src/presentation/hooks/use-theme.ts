"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "../theme/tokens";

export type { ThemeMode };

export interface UseThemeReturn {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export function parseThemeCookie(cookieString: string): ThemeMode | null {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${THEME_STORAGE_KEY}=([^;]+)`),
  );
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return value === "light" || value === "dark" ? value : null;
}

export function serializeThemeCookie(
  theme: ThemeMode,
  isSecure = false,
): string {
  const parts = [
    `${THEME_STORAGE_KEY}=${theme}`,
    "Path=/",
    "Max-Age=31536000",
    "SameSite=Lax",
  ];
  if (isSecure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  }
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof document !== "undefined") {
      if (document.documentElement.classList.contains("light")) {
        return "light";
      }
      const cookieTheme = parseThemeCookie(document.cookie);
      if (cookieTheme) return cookieTheme;
      try {
        const stored = localStorage.getItem(
          THEME_STORAGE_KEY,
        ) as ThemeMode | null;
        if (stored === "light" || stored === "dark") return stored;
      } catch {
        // localStorage unavailable (e.g. incognito or restricted)
      }
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    const currentMode = isLight ? "light" : "dark";
    if (currentMode !== theme) {
      setThemeState(currentMode);
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyThemeToDocument(nextTheme);

    if (typeof document !== "undefined") {
      const isSecure =
        typeof location !== "undefined" && location.protocol === "https:";
      // biome-ignore lint/suspicious/noDocumentCookie: cookie synchronization required for edge SSR persistence
      document.cookie = serializeThemeCookie(nextTheme, isSecure);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage access errors
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme: theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };
}
