"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Card from "@/components/Card/Card";
import Spinner from "@/components/Spinner/Spinner";
import { useAuth } from "@/components/Auth/AuthProvider";
import wallpaperImg from "@/images/wallpaper.jpg";

interface Pokemon {
  pokemonId: number;
  name: string;
  image?: string;
  hp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  height?: number;
  weight?: number;
  type: string[];
  is_custom?: boolean;
}

interface FavoritesResponse {
  favoriteIds: number[];
  favorites: Pokemon[];
}

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [favorites, setFavorites] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<FavoritesResponse>("/api/favorites");
      setFavorites(response.data.favorites ?? []);
    } catch (favoritesError) {
      if (axios.isAxiosError(favoritesError) && favoritesError.response?.status === 401) {
        setFavorites([]);
        return;
      }

      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    void fetchFavorites();
  }, [fetchFavorites, isAuthenticated, isAuthLoading]);

  const handleFavoriteToggle = (pokemonId: number, nextIsFavorite: boolean) => {
    if (nextIsFavorite) {
      return;
    }

    setFavorites((currentFavorites) =>
      currentFavorites.filter((pokemon) => pokemon.pokemonId !== pokemonId)
    );
  };

  if (isAuthLoading || loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${wallpaperImg.src})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <Navbar />
        <div className="pt-24 flex justify-center items-center h-screen relative z-10">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${wallpaperImg.src})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Navbar />
      <div className="relative z-10 min-h-screen px-4 pt-28 pb-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-white mb-3">My Favorites</h1>
            <p className="text-white/80">
              Keep track of the Pokemon you want to revisit quickly.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="max-w-xl mx-auto rounded-2xl bg-white/20 backdrop-blur-sm p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">Sign in to save favorites</h2>
              <p className="text-white/80 mb-6">
                Your favorite Pokemon list is tied to your account.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/login?redirectTo=%2Ffavorites"
                  className="rounded-full bg-[#d14d41] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b8423a]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register?redirectTo=%2Ffavorites"
                  className="rounded-full bg-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/30"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto rounded-2xl bg-red-500/20 backdrop-blur-sm p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">Error</h2>
              <p className="mb-6">{error}</p>
              <button
                type="button"
                onClick={() => void fetchFavorites()}
                className="rounded-full bg-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/30"
              >
                Retry
              </button>
            </div>
          ) : favorites.length === 0 ? (
            <div className="max-w-xl mx-auto rounded-2xl bg-white/20 backdrop-blur-sm p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">No favorites yet</h2>
              <p className="text-white/80 mb-6">
                Browse the home page and tap the heart icon on any Pokemon to save it here.
              </p>
              <Link
                href="/home"
                className="rounded-full bg-[#d14d41] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b8423a]"
              >
                Explore Pokemon
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center content-start">
              {favorites.map((pokemon) => (
                <Card
                  key={pokemon.pokemonId}
                  name={pokemon.name}
                  image={pokemon.image}
                  pokemonId={pokemon.pokemonId}
                  type={pokemon.type}
                  isCustom={pokemon.is_custom}
                  isFavorite={true}
                  detailHref={`/detail/${pokemon.pokemonId}?from=${encodeURIComponent("/favorites")}`}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
