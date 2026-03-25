"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Spinner from "@/components/Spinner/Spinner";
import { background } from "@/assets/backgroundColorByType";
import { useCompare } from "@/components/Compare/CompareProvider";
import noImg from "@/images/charmander.png";
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
}

const STAT_FIELDS = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "speed", label: "Speed" },
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
] as const;

const getStatValue = (pokemon: Pokemon, field: (typeof STAT_FIELDS)[number]["key"]) =>
  Number(pokemon[field] ?? 0);

export default function ComparePage() {
  const { selectedPokemons, clearSelection } = useCompare();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchPokemons = async () => {
      if (selectedPokemons.length === 0) {
        setPokemons([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const responses = await Promise.all(
          selectedPokemons.map((pokemon) => axios.get<Pokemon>(`/api/pokemons/${pokemon.pokemonId}`))
        );

        if (ignore) {
          return;
        }

        const pokemonById = new Map(
          responses.map((response) => [response.data.pokemonId, response.data] as const)
        );

        setPokemons(
          selectedPokemons
            .map((pokemon) => pokemonById.get(pokemon.pokemonId))
            .filter((pokemon): pokemon is Pokemon => Boolean(pokemon))
        );
      } catch {
        if (!ignore) {
          setError("Failed to load Pokemon comparison data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchPokemons();

    return () => {
      ignore = true;
    };
  }, [selectedPokemons]);

  const statWinners = useMemo(() => {
    const winners = new Map<string, number>();

    STAT_FIELDS.forEach((field) => {
      const values = pokemons.map((pokemon) => getStatValue(pokemon, field.key));
      const maxValue = Math.max(...values, 0);
      winners.set(field.key, maxValue);
    });

    return winners;
  }, [pokemons]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${wallpaperImg.src})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Navbar />
      <div className="relative z-10 min-h-screen px-4 pt-28 pb-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Pokemon Compare</h1>
              <p className="text-white/80">
                Compare up to three Pokemon side by side and spot the strongest stat lines quickly.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/home"
                className="rounded-full bg-white/20 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/30"
              >
                Add more
              </Link>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full bg-[#d14d41] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#b8423a]"
              >
                Clear compare
              </button>
            </div>
          </div>

          {selectedPokemons.length < 2 ? (
            <div className="max-w-2xl mx-auto rounded-2xl bg-white/20 backdrop-blur-sm p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">Pick at least 2 Pokemon</h2>
              <p className="text-white/80 mb-6">
                Use the scale icon on cards or detail pages to add Pokemon to the compare list.
              </p>
              <Link
                href="/home"
                className="rounded-full bg-[#d14d41] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b8423a]"
              >
                Go to home
              </Link>
            </div>
          ) : loading ? (
            <div className="pt-24 flex justify-center items-center">
              <Spinner />
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto rounded-2xl bg-red-500/20 backdrop-blur-sm p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">Error</h2>
              <p>{error}</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${pokemons.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
              {pokemons.map((pokemon) => {
                const primaryType = pokemon.type[0] ?? "normal";
                const typeColors = background[primaryType as keyof typeof background] || background.normal;
                const totalStats =
                  getStatValue(pokemon, "hp") +
                  getStatValue(pokemon, "attack") +
                  getStatValue(pokemon, "defense") +
                  getStatValue(pokemon, "speed");

                return (
                  <div
                    key={pokemon.pokemonId}
                    className="overflow-hidden rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl"
                  >
                    <div className="p-8" style={{ backgroundColor: `${typeColors[0]}55` }}>
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-white/80">#{pokemon.pokemonId}</p>
                          <h2 className="mt-2 text-3xl font-bold capitalize text-white">{pokemon.name}</h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {pokemon.type.map((type) => {
                              const colors = background[type as keyof typeof background] || background.normal;

                              return (
                                <span
                                  key={type}
                                  className="rounded-full px-4 py-2 text-sm font-semibold"
                                  style={{ backgroundColor: colors[0], color: colors[1] }}
                                >
                                  {type}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-white/15 p-4 sm:w-40">
                          <Image
                            src={pokemon.image || noImg}
                            alt={`${pokemon.name} image`}
                            width={160}
                            height={160}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-8 text-white">
                      <div className="mb-6 rounded-2xl bg-white/10 p-4 text-center">
                        <p className="text-sm uppercase tracking-wide text-white/70">Total Base Stats</p>
                        <p className="mt-2 text-4xl font-bold">{totalStats}</p>
                      </div>

                      <div className="space-y-3">
                        {STAT_FIELDS.map((field) => {
                          const value = getStatValue(pokemon, field.key);
                          const isWinner = value > 0 && value === statWinners.get(field.key);
                          const suffix = field.key === "height" ? " cm" : field.key === "weight" ? " kg" : "";

                          return (
                            <div
                              key={field.key}
                              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                                isWinner ? "bg-emerald-500/20" : "bg-white/10"
                              }`}
                            >
                              <span className="font-semibold">{field.label}</span>
                              <span className="text-lg">
                                {value}
                                {suffix}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
