"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import Spinner from "@/components/Spinner/Spinner";
import { background } from "@/assets/backgroundColorByType";
import wallpaperImg from "@/images/wallpaper.jpg";
import noImg from "@/images/charmander.png";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";

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

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/pokemons/${params.id}`);
        setPokemon(response.data);
      } catch (error) {
        console.error("Error fetching Pokemon:", error);
        setError("Pokemon not found");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPokemon();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${wallpaperImg.src})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <Navbar />
        <div className="pt-20 flex justify-center items-center h-screen relative z-10">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${wallpaperImg.src})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <Navbar />
        <div className="pt-32 px-4 pb-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8">
              <h1 className="text-3xl font-bold text-white mb-4">Pokemon Not Found</h1>
              <p className="text-white mb-6">The Pokemon you're looking for doesn't exist.</p>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const primaryType = pokemon.type && pokemon.type.length > 0 ? pokemon.type[0] : 'normal';
  const typeColors = background[primaryType as keyof typeof background] || background.normal;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${wallpaperImg.src})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Navbar />
      <div className="pt-32 px-4 pb-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Pokemon Detail Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              {/* Image Section */}
              <div 
                className="md:w-1/2 p-8 flex items-center justify-center"
                style={{ backgroundColor: `${typeColors[0]}40` }}
              >
                <Image
                  src={pokemon.image || noImg}
                  alt={pokemon.name}
                  width={300}
                  height={300}
                  className="w-full h-auto max-w-sm object-contain"
                />
              </div>

              {/* Info Section */}
              <div className="md:w-1/2 p-8">
                <div className="text-white">
                  {/* Header */}
                  <div className="mb-6">
                    <p className="text-lg opacity-80">#{pokemon.pokemonId}</p>
                    <h1 className="text-4xl font-bold capitalize mb-4">{pokemon.name}</h1>
                    
                    {/* Types */}
                    <div className="flex gap-2 mb-6">
                      {pokemon.type?.map((type, index) => {
                        const colors = background[type as keyof typeof background] || background.normal;
                        return (
                          <span
                            key={index}
                            className="px-4 py-2 rounded-full text-sm font-semibold"
                            style={{ backgroundColor: colors[0], color: colors[1] }}
                          >
                            {type}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold mb-4">Stats</h3>
                    
                    {pokemon.hp !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">HP:</span>
                        <span className="text-lg">{pokemon.hp}</span>
                      </div>
                    )}
                    
                    {pokemon.attack !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Attack:</span>
                        <span className="text-lg">{pokemon.attack}</span>
                      </div>
                    )}
                    
                    {pokemon.defense !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Defense:</span>
                        <span className="text-lg">{pokemon.defense}</span>
                      </div>
                    )}
                    
                    {pokemon.speed !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Speed:</span>
                        <span className="text-lg">{pokemon.speed}</span>
                      </div>
                    )}
                    
                    {pokemon.height !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Height:</span>
                        <span className="text-lg">{pokemon.height} cm</span>
                      </div>
                    )}
                    
                    {pokemon.weight !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Weight:</span>
                        <span className="text-lg">{pokemon.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button - Centered below detail card */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors"
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}