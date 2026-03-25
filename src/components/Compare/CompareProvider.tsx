"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const COMPARE_STORAGE_KEY = "pokemon-compare-selection";
const MAX_COMPARE_ITEMS = 3;

export interface ComparePokemon {
  pokemonId: number;
  name: string;
  image?: string;
  type?: string[];
}

interface CompareContextValue {
  selectedPokemons: ComparePokemon[];
  selectedCount: number;
  isSelected: (pokemonId: number) => boolean;
  togglePokemon: (pokemon: ComparePokemon) => "added" | "removed" | "limit";
  clearSelection: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const isValidComparePokemon = (value: unknown): value is ComparePokemon => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ComparePokemon;
  return Number.isInteger(candidate.pokemonId) && candidate.pokemonId > 0 && typeof candidate.name === "string";
};

export const CompareProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPokemons, setSelectedPokemons] = useState<ComparePokemon[]>([]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

      const parsedValue = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) {
        return;
      }

      setSelectedPokemons(parsedValue.filter(isValidComparePokemon).slice(0, MAX_COMPARE_ITEMS));
    } catch {
      window.localStorage.removeItem(COMPARE_STORAGE_KEY);
    } finally {
      setHasHydratedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedStorage) {
      return;
    }

    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(selectedPokemons));
  }, [hasHydratedStorage, selectedPokemons]);

  const isSelected = useCallback(
    (pokemonId: number) => selectedPokemons.some((pokemon) => pokemon.pokemonId === pokemonId),
    [selectedPokemons]
  );

  const togglePokemon = useCallback(
    (pokemon: ComparePokemon) => {
      if (selectedPokemons.some((selectedPokemon) => selectedPokemon.pokemonId === pokemon.pokemonId)) {
        setSelectedPokemons((currentSelection) =>
          currentSelection.filter((selectedPokemon) => selectedPokemon.pokemonId !== pokemon.pokemonId)
        );
        return "removed";
      }

      if (selectedPokemons.length >= MAX_COMPARE_ITEMS) {
        return "limit";
      }

      setSelectedPokemons((currentSelection) => [...currentSelection, pokemon]);
      return "added";
    },
    [selectedPokemons]
  );

  const clearSelection = useCallback(() => {
    setSelectedPokemons([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedPokemons,
      selectedCount: selectedPokemons.length,
      isSelected,
      togglePokemon,
      clearSelection,
    }),
    [selectedPokemons, isSelected, togglePokemon, clearSelection]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

export const useCompare = () => {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }

  return context;
};
