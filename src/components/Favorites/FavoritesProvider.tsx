"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/Auth/AuthProvider";

interface FavoritesContextValue {
  favoriteIds: number[];
  favoriteCount: number;
  isLoading: boolean;
  isFavorite: (pokemonId: number) => boolean;
  setFavoriteState: (pokemonId: number, nextIsFavorite: boolean) => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestRef = useRef(0);

  const setFavoriteState = useCallback((pokemonId: number, nextIsFavorite: boolean) => {
    setFavoriteIds((currentFavoriteIds) => {
      const nextFavoriteIds = new Set(currentFavoriteIds);

      if (nextIsFavorite) {
        nextFavoriteIds.add(pokemonId);
      } else {
        nextFavoriteIds.delete(pokemonId);
      }

      return [...nextFavoriteIds];
    });
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      setIsLoading(false);
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    try {
      setIsLoading(true);

      const response = await axios.get<{ favoriteIds: number[] }>("/api/favorites", {
        params: {
          idsOnly: true,
        },
      });

      if (requestId !== latestRequestRef.current) {
        return;
      }

      setFavoriteIds(response.data.favoriteIds ?? []);
    } catch (error) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setFavoriteIds([]);
        return;
      }

      console.error("Error fetching favorite ids:", error);
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void refreshFavorites();
  }, [isAuthLoading, refreshFavorites]);

  const value = useMemo(
    () => ({
      favoriteIds,
      favoriteCount: favoriteIds.length,
      isLoading,
      isFavorite: (pokemonId: number) => favoriteIds.includes(pokemonId),
      setFavoriteState,
      refreshFavorites,
    }),
    [favoriteIds, isLoading, refreshFavorites, setFavoriteState]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
};
