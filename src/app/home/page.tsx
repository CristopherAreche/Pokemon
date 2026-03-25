"use client";

import { Suspense } from "react";
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Card from "@/components/Card/Card";
import SearchBar from "@/components/SearchBar/SearchBar";
import Filter from "@/components/Filter/Filter";
import Pagination from "@/components/Pagination/Pagination";
import Spinner from "@/components/Spinner/Spinner";
import { useAdminSession } from "@/components/AdminSession/AdminSessionProvider";
import { useFavorites } from "@/components/Favorites/FavoritesProvider";
import wallpaperImg from "@/images/wallpaper.jpg";

interface Pokemon {
  id?: number;
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

interface PokemonApiResponse {
  data: Pokemon[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_TYPE = "all";

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const HomePageFallback = () => (
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

function HomePageContent() {
  const { isAdmin, isCheckingSession } = useAdminSession();
  const { favoriteIds } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(() =>
    parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE)
  );
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search")?.trim() ?? "");
  const [selectedType, setSelectedType] = useState(
    () => searchParams.get("type")?.trim() || DEFAULT_TYPE
  );
  const latestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const pokemonsPerPage = 18;

  const buildReturnTo = useCallback(() => {
    const params = new URLSearchParams();

    if (currentPage > DEFAULT_PAGE) {
      params.set("page", String(currentPage));
    }

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (selectedType !== DEFAULT_TYPE) {
      params.set("type", selectedType);
    }

    return params.toString() ? `${pathname}?${params.toString()}` : pathname;
  }, [currentPage, pathname, searchTerm, selectedType]);

  useEffect(() => {
    const nextUrl = buildReturnTo();
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [buildReturnTo, pathname, router, searchParams]);

  const fetchPokemons = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    const isInitialLoad = !hasLoadedOnceRef.current;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }

      setError(null);

      const response = await axios.get<PokemonApiResponse>("/api/pokemons", {
        params: {
          page: currentPage,
          pageSize: pokemonsPerPage,
          search: searchTerm || undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          sort: "pokemonId_asc",
        },
      });

      if (requestId !== latestRequestRef.current) {
        return;
      }

      if (Array.isArray(response.data)) {
        const fallbackPokemons = response.data as unknown as Pokemon[];
        setPokemons(fallbackPokemons);
        setTotalPages(
          fallbackPokemons.length === 0
            ? 0
            : Math.ceil(fallbackPokemons.length / pokemonsPerPage)
        );
      } else {
        const payload = response.data;
        setPokemons(payload.data ?? []);
        setTotalPages(payload.pagination?.totalPages ?? 0);

        if (payload.pagination && payload.pagination.page !== currentPage) {
          setCurrentPage(payload.pagination.page);
        }
      }

      hasLoadedOnceRef.current = true;
    } catch (error) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      console.error("Error fetching pokemons:", error);
      setError("Failed to load Pokémon. Please try again.");

      if (isInitialLoad) {
        setPokemons([]);
        setTotalPages(0);
      }
    } finally {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      setLoading(false);
      setIsFetching(false);
    }
  }, [currentPage, pokemonsPerPage, searchTerm, selectedType]);

  useEffect(() => {
    fetchPokemons();
  }, [fetchPokemons]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handlePokemonDelete = useCallback(() => {
    fetchPokemons();
  }, [fetchPokemons]);

  if (loading) {
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
      <div className="pt-24 px-4 pb-8 relative z-10 min-h-screen flex flex-col">
        <div className="max-w-[1280px] mx-auto w-full flex-1 flex flex-col">
          {/* Search and Filter Section */}
          <div className="mb-12 mt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
            <SearchBar onSearch={handleSearch} value={searchTerm} />
            <Filter onTypeFilter={handleTypeFilter} selectedType={selectedType} />
          </div>

          {isFetching && (
            <div className="mb-6 text-center">
              <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                Updating results...
              </span>
            </div>
          )}

          {isAdmin && !isCheckingSession && (
            <div className="mb-6 text-center">
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                Admin session active
              </span>
            </div>
          )}


          {/* Pokemon Grid */}
          <div className="relative flex-1 flex flex-col">
            {error ? (
              <div className="text-center py-12 flex-1 flex items-center justify-center">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
                  <h3 className="text-white text-xl font-bold mb-4">Error</h3>
                  <p className="text-white mb-4">{error}</p>
                  <button
                    onClick={fetchPokemons}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : pokemons.length > 0 ? (
              <>
                {/* Pokemon Cards Grid */}
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center content-start mb-12 transition-opacity ${
                    isFetching ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {pokemons.map((pokemon) => {
                    const returnTo = buildReturnTo();

                    return (
                    <Card 
                      key={pokemon.pokemonId} 
                      name={pokemon.name}
                      image={pokemon.image}
                      pokemonId={pokemon.pokemonId}
                      type={pokemon.type}
                      isCustom={pokemon.is_custom}
                      isFavorite={favoriteIds.includes(pokemon.pokemonId)}
                      canDelete={isAdmin && !isCheckingSession}
                      detailHref={
                        pokemon.pokemonId
                          ? `/detail/${pokemon.pokemonId}?from=${encodeURIComponent(returnTo)}`
                          : "#"
                      }
                      onDelete={handlePokemonDelete}
                    />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-auto">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      disabled={isFetching}
                    />
                  </div>
                )}
              </>
            ) : (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
                    <h3 className="text-white text-xl font-bold mb-4">No Pokémon Found</h3>
                    <p className="text-white">
                    {searchTerm || selectedType !== "all"
                      ? "Try adjusting your search criteria."
                      : "No Pokémon available at the moment."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
