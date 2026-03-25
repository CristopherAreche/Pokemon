"use client";

import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";
import { useAuth } from "@/components/Auth/AuthProvider";

interface FavoriteButtonProps {
  pokemonId: number;
  initialIsFavorite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

const FavoriteButton = ({
  pokemonId,
  initialIsFavorite,
  onToggle,
  className = "",
  size = "sm",
}: FavoriteButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isFavorite, setIsFavorite] = useState(Boolean(initialIsFavorite));
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof initialIsFavorite === "boolean") {
      setIsFavorite(initialIsFavorite);
    }
  }, [initialIsFavorite]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsFavorite(false);
      return;
    }

    if (typeof initialIsFavorite === "boolean") {
      return;
    }

    let ignore = false;

    const fetchFavoriteStatus = async () => {
      try {
        setIsCheckingFavorite(true);
        const response = await axios.get<{ isFavorite: boolean }>(`/api/favorites/${pokemonId}`);

        if (!ignore) {
          setIsFavorite(Boolean(response.data.isFavorite));
        }
      } catch {
        if (!ignore) {
          setIsFavorite(false);
        }
      } finally {
        if (!ignore) {
          setIsCheckingFavorite(false);
        }
      }
    };

    void fetchFavoriteStatus();

    return () => {
      ignore = true;
    };
  }, [initialIsFavorite, isAuthenticated, pokemonId]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const currentSearch = searchParams.toString();
    const redirectTo = currentSearch ? `${pathname}?${currentSearch}` : pathname;

    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    try {
      setIsUpdating(true);

      if (isFavorite) {
        await axios.delete(`/api/favorites/${pokemonId}`);
        setIsFavorite(false);
        onToggle?.(false);
      } else {
        await axios.post("/api/favorites", { pokemonId });
        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      alert("Failed to update favorites.");
    } finally {
      setIsUpdating(false);
    }
  };

  const buttonSize = size === "md" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm";
  const showSpinner = isUpdating || (isAuthenticated && isCheckingFavorite) || isAuthLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={showSpinner}
      className={`flex items-center justify-center rounded-full bg-white/85 text-[#d14d41] shadow-md transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 ${buttonSize} ${className}`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {showSpinner ? (
        <FaSpinner className="animate-spin" />
      ) : isFavorite ? (
        <FaHeart />
      ) : (
        <FaRegHeart />
      )}
    </button>
  );
};

export default FavoriteButton;
