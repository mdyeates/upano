import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useFetcher } from "react-router";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const fetcher = useFetcher();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      // Apply class immediately so toggle feels instant. The next
      // SSR render will confirm via the cookie loader.
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(next);
        root.style.colorScheme = next;
      }
      const fd = new FormData();
      fd.set("theme", next);
      fetcher.submit(fd, { method: "post", action: "/theme" });
    },
    [fetcher],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
