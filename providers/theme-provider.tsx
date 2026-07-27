"use client";

/**
 * providers/theme-provider.tsx
 *
 * Manages light / dark / system theme.
 * Applies the `.dark` class to <html> and persists choice to localStorage.
 * Exports ThemeProvider (context) and useTheme (hook).
 *
 * Implementation uses useSyncExternalStore — the React 18+ API for external
 * stores. This is the correct solution for two requirements that conflict
 * when using useState:
 *
 * 1. Hydration safety: server and client must produce identical HTML on the
 *    first render. getServerSnapshot() always returns "system", which the
 *    server also renders. React handles the post-hydration switch to the
 *    real client value internally.
 *
 * 2. No setState in effects: the lint rule react-hooks/set-state-in-effect
 *    forbids calling setState synchronously inside a useEffect body.
 *    useSyncExternalStore removes the need for that pattern entirely.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
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

/* ── Module-level external store ────────────────────────────── */
/*
 * useSyncExternalStore requires three things:
 * 1. subscribe(callback) — called by React to subscribe to store changes.
 * 2. getSnapshot()       — reads current value on the client.
 * 3. getServerSnapshot() — reads current value on the server (must be stable).
 *
 * Writing to the store calls notifyThemeListeners() to trigger React re-renders.
 */

const themeListeners = new Set<() => void>();

function subscribeToTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

function getThemeSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
}

/** Always "system" — ensures server render matches client's first render. */
function getThemeServerSnapshot(): Theme {
  return "system";
}

function notifyThemeListeners(): void {
  themeListeners.forEach((l) => l());
}

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
  /*
   * useSyncExternalStore reads theme from localStorage on the client and
   * from getThemeServerSnapshot on the server. React reconciles the
   * difference after hydration without any mismatch warning.
   *
   * resolvedTheme is derived synchronously — no second useState needed.
   */
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const resolvedTheme = resolveTheme(theme);

  /* Apply theme class to DOM whenever resolvedTheme changes.
     applyTheme() only touches the DOM — it does not call setState. */
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  /* Subscribe to system preference changes.
     Only active when theme === "system". Applies directly to DOM — no setState. */
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme(getSystemTheme());
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [theme]);

  /*
   * setTheme writes to localStorage then notifies the useSyncExternalStore
   * listeners, which triggers React to re-render with the new snapshot.
   * No setState call needed.
   */
  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    notifyThemeListeners();
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
