/**
 * WorshipFlow Theme & Design Token Constants
 * Type-safe access to semantic design tokens defined in globals.css.
 */

export type ThemeMode = "dark" | "light";

export interface ThemeContextState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const THEME_STORAGE_KEY = "worshipflow_theme";

export const DEFAULT_THEME: ThemeMode = "dark";

export const DESIGN_TOKENS = {
  colors: {
    dark: {
      background: "#090d16",
      foreground: "#f8fafc",
      card: "#0f172a",
      cardForeground: "#f8fafc",
      primary: "#6366f1",
      primaryHover: "#4f46e5",
      primaryForeground: "#ffffff",
      secondary: "#1e293b",
      secondaryForeground: "#f8fafc",
      chordAccent: "#fbbf24",
      chordAccentBg: "rgba(251, 191, 36, 0.12)",
      chordAccentBorder: "rgba(251, 191, 36, 0.35)",
      muted: "#1e293b",
      mutedForeground: "#94a3b8",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#1e293b",
      input: "#1e293b",
      ring: "#6366f1",
    },
    light: {
      background: "#f8fafc",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      primary: "#4f46e5",
      primaryHover: "#4338ca",
      primaryForeground: "#ffffff",
      secondary: "#f1f5f9",
      secondaryForeground: "#0f172a",
      chordAccent: "#92400e",
      chordAccentBg: "#fef3c7",
      chordAccentBorder: "#fcd34d",
      muted: "#f1f5f9",
      mutedForeground: "#475569",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "#e2e8f0",
      input: "#ffffff",
      ring: "#4f46e5",
    },
  },
  radii: {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  status: {
    ready: "#10b981",
    practicing: "#f59e0b",
    pending: "#94a3b8",
  },
  roles: {
    admin: "#a855f7",
    member: "#38bdf8",
  },
  tiers: {
    p1: "#ef4444",
    p2: "#f59e0b",
    p3: "#38bdf8",
    p4: "#a855f7",
  },
} as const;
