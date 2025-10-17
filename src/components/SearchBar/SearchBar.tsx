"use client";

import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  onSearch: (term: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Live search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]); // Remove onSearch from dependencies to prevent infinite loops

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          className="rounded-full pl-4 pr-12 text-black w-40 md:w-80 py-3 bg-white/90 backdrop-blur-sm shadow-lg border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={handleChange}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {searchTerm && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
          <FaSearch className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;