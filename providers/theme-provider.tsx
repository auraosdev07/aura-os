"use client";

/**
 * providers/theme-provider.tsx
 *
 * Manages light / dark / system theme.
 * Applies the `.dark` class to <html> and persists choice to localStorage.
 * Exports ThemeProvider (context) and useTheme (hook).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ── Types ──────────────────────────────────────────────────── */

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The user-chosen preference ("light" | "dark" | "system"). */
  theme: Theme;
  /** The resolved value actually applied to the DOM ("light" | "dark"). */
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

/* ── Context ────────────────────────────────────────────────── */

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "aura-theme";

/* ── Pure helpers (no side-effects) ────────────────────────── */

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(t: Theme): "light" | "dark" {
  return t === "system" ? getSystemTheme() : t;
}

/** Read the stored theme — safe to call during client render. */
function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/* ── Provider ───────────────────────────────────────────────── */

export function ThemeProvider({ children }: { children: ReactNode }) {
  /**
   * Lazy initializers run once on the client during first render.
   * This avoids calling setState() synchronously inside a useEffect,
   * which would violate the react-hooks/set-state-in-effect rule.
   */
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveTheme(readStoredTheme()),
  );

  /* Apply resolved theme to DOM whenever it changes. No setState here. */
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  /* Subscribe to system preference changes.
     setState is only called inside the event callback — not in the effect body. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    const resolved = resolveTheme(next);
    setThemeState(next);
    setResolvedTheme(resolved);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
