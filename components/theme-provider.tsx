"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark" | "light";
type Surface = "studio" | "marketing";

interface ThemeCtx {
  theme: Theme;
  surface: Surface;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  surface: "marketing",
  toggle: () => {},
  setTheme: () => {},
});

const STORAGE_KEY: Record<Surface, string> = {
  studio: "analystai-theme-studio",
  marketing: "analystai-theme-marketing",
};

const SURFACE_DEFAULT: Record<Surface, Theme> = {
  studio: "dark",
  marketing: "light",
};

function surfaceFromPath(pathname: string | null | undefined): Surface {
  return pathname && pathname.indexOf("/studio") === 0 ? "studio" : "marketing";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [surface, setSurface] = useState<Surface>(() => surfaceFromPath(pathname));
  const [theme, setThemeState] = useState<Theme>(() => SURFACE_DEFAULT[surfaceFromPath(pathname)]);

  // Apply the resolved theme to <html> and persist an explicit override.
  const apply = useCallback((nextSurface: Surface, nextTheme: Theme) => {
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  // Resolve which theme to show for a surface: stored override, else the default.
  const resolve = useCallback((s: Surface): Theme => {
    if (typeof localStorage === "undefined") return SURFACE_DEFAULT[s];
    const stored = localStorage.getItem(STORAGE_KEY[s]) as Theme | null;
    return stored === "dark" || stored === "light" ? stored : SURFACE_DEFAULT[s];
  }, []);

  // Initial mount: trust the inline bootstrap script, then sync state to it.
  useEffect(() => {
    const s = surfaceFromPath(pathname);
    setSurface(s);
    const current = (document.documentElement.getAttribute("data-theme") as Theme | null) ?? SURFACE_DEFAULT[s];
    setThemeState(current === "dark" || current === "light" ? current : SURFACE_DEFAULT[s]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user crosses surfaces (marketing <-> studio), switch to that
  // surface's resolved theme. A user who toggled stays toggled *per surface*.
  useEffect(() => {
    const s = surfaceFromPath(pathname);
    if (s === surface) return;
    setSurface(s);
    const next = resolve(s);
    setThemeState(next);
    apply(s, next);
  }, [pathname, surface, resolve, apply]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY[surface], t);
      apply(surface, t);
    },
    [surface, apply],
  );

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <Ctx.Provider value={{ theme, surface, toggle, setTheme }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
