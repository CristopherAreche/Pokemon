"use client";

import { FaChevronDown, FaTimes } from "react-icons/fa";

interface FilterProps {
  onTypeFilter: (type: string) => void;
  selectedType: string;
}

const Filter = ({ onTypeFilter, selectedType }: FilterProps) => {

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  function handleFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onTypeFilter(value);
  }

  function clearFilters() {
    onTypeFilter("all");
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex gap-4">
        <div className="flex justify-center items-center gap-2 relative">
          <select
            className="appearance-none w-auto pl-3 pr-8 py-2 rounded-full text-gray-700 bg-white/90 backdrop-blur-sm shadow-lg border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={handleFilter}
            value={selectedType}
          >
            <option value="all">All Types</option>
            {pokemonTypes.map((type, index) => {
              return (
                <option key={index} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              );
            })}
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={clearFilters}
          className="py-2 px-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-colors flex items-center gap-2"
        >
          <span>Clear Filters</span>
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default Filter;