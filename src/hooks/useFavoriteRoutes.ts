import { useCallback, useEffect, useState } from "react";

export type Route = { from: string; to: string };

const STORAGE_KEY = "kashmir.favoriteRoutes.v1";
const EVENT_NAME = "kashmir-favorite-routes-change";

const routeKey = (r: Route) => `${r.from.trim().toLowerCase()}→${r.to.trim().toLowerCase()}`;

const readStorage = (): Route[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is Route =>
        r && typeof r.from === "string" && typeof r.to === "string" && r.from.trim() && r.to.trim(),
    );
  } catch {
    return [];
  }
};

const writeStorage = (routes: Route[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore quota / disabled storage
  }
};

export const useFavoriteRoutes = () => {
  const [favorites, setFavorites] = useState<Route[]>(() => readStorage());

  useEffect(() => {
    const sync = () => setFavorites(readStorage());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback(
    (route: Route) => favorites.some((f) => routeKey(f) === routeKey(route)),
    [favorites],
  );

  const toggleFavorite = useCallback((route: Route) => {
    if (!route.from?.trim() || !route.to?.trim() || route.from === route.to) return;
    const current = readStorage();
    const exists = current.some((f) => routeKey(f) === routeKey(route));
    const next = exists
      ? current.filter((f) => routeKey(f) !== routeKey(route))
      : [{ from: route.from, to: route.to }, ...current];
    writeStorage(next);
    setFavorites(next);
  }, []);

  return { favorites, isFavorite, toggleFavorite };
};

/** Merge favorites first, then preset routes (de-duped). */
export const mergeFavoritesFirst = (favorites: Route[], presets: Route[]): Route[] => {
  const seen = new Set<string>();
  const out: Route[] = [];
  for (const r of [...favorites, ...presets]) {
    const k = routeKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
};
