"use client";

import { FaBalanceScale, FaCheck } from "react-icons/fa";
import { ComparePokemon, useCompare } from "@/components/Compare/CompareProvider";

interface CompareButtonProps {
  pokemon: ComparePokemon;
  className?: string;
  size?: "sm" | "md";
}

const CompareButton = ({ pokemon, className = "", size = "sm" }: CompareButtonProps) => {
  const { isSelected, togglePokemon } = useCompare();
  const selected = isSelected(pokemon.pokemonId);
  const buttonSize = size === "md" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm";

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const result = togglePokemon(pokemon);
    if (result === "limit") {
      alert("You can compare up to 3 Pokemon at a time.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-center rounded-full shadow-md transition-colors ${buttonSize} ${
        selected
          ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
          : "bg-slate-900/75 text-white hover:bg-slate-800/90"
      } ${className}`}
      title={selected ? "Remove from compare" : "Add to compare"}
      aria-label={selected ? "Remove from compare" : "Add to compare"}
    >
      {selected ? <FaCheck /> : <FaBalanceScale />}
    </button>
  );
};

export default CompareButton;
