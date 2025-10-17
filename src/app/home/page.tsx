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
}

export default function HomePage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [filteredPokemons, setFilteredPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const pokemonsPerPage = 18;


  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/pokemons");
        console.log(`Loaded ${response.data.length} Pokemon from API`);
        setPokemons(response.data);
        setFilteredPokemons(response.data);
      } catch (error) {
        console.error("Error fetching pokemons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemons();
  }, []);

  // Search functionality - search locally in database results
  const searchPokemons = useCallback((term: string) => {
    if (!term.trim()) {
      // If search term is empty, show all pokemons with type filter
      let filtered = pokemons;
      if (selectedType !== "all") {
        filtered = filtered.filter((pokemon) =>
          pokemon.type.includes(selectedType)
        );
      }
      setFilteredPokemons(filtered);
      return;
    }

    // Search locally in the loaded pokemon data
    let filtered = pokemons.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(term.toLowerCase())
    );

    // Apply type filter to search results
    if (selectedType !== "all") {
      filtered = filtered.filter((pokemon) =>
        pokemon.type.includes(selectedType)
      );
    }

    setFilteredPokemons(filtered);
  }, [pokemons, selectedType]);

  // Handle type filtering
  useEffect(() => {
    if (!searchTerm) {
      // If no search term, filter the original pokemons list
      let filtered = pokemons;
      if (selectedType !== "all") {
        filtered = filtered.filter((pokemon) =>
          pokemon.type.includes(selectedType)
        );
      }
      setFilteredPokemons(filtered);
    }
  }, [selectedType, pokemons, searchTerm]);

  // Pagination logic
  const indexOfLastPokemon = currentPage * pokemonsPerPage;
  const indexOfFirstPokemon = indexOfLastPokemon - pokemonsPerPage;
  const currentPokemons = filteredPokemons.slice(indexOfFirstPokemon, indexOfLastPokemon);
  const totalPages = Math.ceil(filteredPokemons.length / pokemonsPerPage);

  // Debug pagination (comment out in production)
  // console.log(`Pagination: Page ${currentPage}/${totalPages}, showing ${currentPokemons.length} of ${filteredPokemons.length} Pokemon`);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchPokemons(term);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchPokemons]); // Add dependencies

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1); // Reset to first page when type filter changes
  };

  const handlePokemonDelete = (deletedPokemonId: number) => {
    // Remove the deleted Pokemon from the current lists without refreshing
    setPokemons(prev => prev.filter(pokemon => pokemon.pokemonId !== deletedPokemonId));
    setFilteredPokemons(prev => prev.filter(pokemon => pokemon.pokemonId !== deletedPokemonId));
    
    console.log(`Pokemon with ID ${deletedPokemonId} removed from current page`);
  };

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
            {currentPokemons.length > 0 ? (
              <>
                {/* Pokemon Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center mb-12">
                  {currentPokemons.map((pokemon) => (
                    <Card 
                      key={pokemon.pokemonId} 
                      name={pokemon.name}
                      image={pokemon.image}
                      pokemonId={pokemon.pokemonId}
                      type={pokemon.type}
                      onDelete={() => handlePokemonDelete(pokemon.pokemonId)}
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