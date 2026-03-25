"use client";

import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) => {
  const [input, setInput] = useState(currentPage || 1);

  useEffect(() => {
    setInput(currentPage || 1);
  }, [currentPage]);

  const nextPage = () => {
    if (!disabled && currentPage < totalPages) {
      const newPage = currentPage + 1;
      setInput(newPage);
      onPageChange(newPage);
    }
  };

  const prevPage = () => {
    if (!disabled && currentPage > 1) {
      const newPage = currentPage - 1;
      setInput(newPage);
      onPageChange(newPage);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value);
      
      if (value < 1 || value > totalPages || isNaN(value)) {
        onPageChange(1);
        setInput(1);
      } else {
        onPageChange(value);
        setInput(value);
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(parseInt(e.target.value) || 1);
  };

  return (
    <div className="flex justify-center items-center gap-4">
      <button
        type="button"
        disabled={currentPage <= 1}
        className="p-4 rounded-full bg-white/20 backdrop-blur-sm text-lg text-white disabled:opacity-50 hover:bg-white/30 transition-colors"
        onClick={prevPage}
      >
        <FaArrowLeft />
      </button>
      <div className="flex">
        <input
          className="bg-white/20 backdrop-blur-sm text-white w-12 h-auto text-center text-lg rounded-l-full outline-none border-none py-2 placeholder-white/60"
          onChange={onChange}
          onKeyDown={onKeyDown}
          name="page"
          autoComplete="off"
          value={input}
          disabled={disabled}
        />
        <p className="bg-white/20 backdrop-blur-sm text-white text-lg pr-5 py-2 rounded-r-full outline-none border-none">
          <span className="mr-3 text-white">of</span> {totalPages}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled || currentPage >= totalPages}
        className="p-4 rounded-full bg-white/20 backdrop-blur-sm text-lg text-white disabled:opacity-50 hover:bg-white/30 transition-colors"
        onClick={nextPage}
      >
        <FaArrowRight />
      </button>
    </div>
  );
};

export default Pagination;
