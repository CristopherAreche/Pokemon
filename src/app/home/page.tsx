"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Card from "@/components/Card/Card";
import SearchBar from "@/components/SearchBar/SearchBar";
import Filter from "@/components/Filter/Filter";
import Pagination from "@/components/Pagination/Pagination";
import Spinner from "@/components/Spinner/Spinner";
import wallpaperImg from "@/images/wallpaper.jpg";
import axios from "axios";

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

export default function HomePage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const pokemonsPerPage = 18;

  const fetchPokemons = useCallback(async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Error fetching pokemons:", error);
      setError("Failed to load Pokémon. Please try again.");
      setPokemons([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
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
            <SearchBar onSearch={handleSearch} />
            <Filter onTypeFilter={handleTypeFilter} selectedType={selectedType} />
          </div>


          {/* Pokemon Grid - Centered Content */}
          <div className="flex-1 flex flex-col justify-center">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center mb-12">
                  {pokemons.map((pokemon) => (
                    <Card 
                      key={pokemon.pokemonId} 
                      name={pokemon.name}
                      image={pokemon.image}
                      pokemonId={pokemon.pokemonId}
                      type={pokemon.type}
                      isCustom={pokemon.is_custom}
                      onDelete={handlePokemonDelete}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-auto">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
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
