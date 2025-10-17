"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { background, backgroundImg } from "@/assets/backgroundColorByType";
import noImg from "@/images/charmander.png";
import axios from "axios";

interface TypeLabelProps {
  element: string;
}

const TypeLabel = ({ element }: TypeLabelProps) => {
  const colors = background[element as keyof typeof background] || background.normal;
  return (
    <div
      className="w-16 py-1 rounded-md flex items-center justify-center text-sm"
      style={{ backgroundColor: colors[0], color: colors[1] }}
    >
      {element}
    </div>
  );
};

interface CardProps {
  name: string;
  image?: string;
  pokemonId?: number;
  type?: string[];
  onDelete?: (pokemonId: number) => void;
}

const Card = ({ name, image, pokemonId, type, onDelete }: CardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const primaryType = type && type.length > 0 ? type[0] : 'normal';
  const bgColor = backgroundImg[primaryType as keyof typeof backgroundImg] || backgroundImg.normal;
  
  // Check if this is a custom Pokemon (ID > 151)
  const isCustomPokemon = pokemonId && pokemonId > 151;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pokemonId) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`/api/pokemons?id=${pokemonId}`);
      setShowDeleteModal(false);
      if (onDelete) {
        onDelete(pokemonId);
      }
    } catch (error) {
      console.error('Error deleting Pokemon:', error);
      alert('Failed to delete Pokemon');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Link
        href={pokemonId ? `/detail/${pokemonId}` : '#'}
        className="block text-black no-underline"
      >
        <div className="w-52 h-80 rounded-xl bg-white shadow-md shadow-gray-900 hover:scale-105 transition-transform duration-200 mx-auto relative">
          {/* Delete button for custom Pokemon */}
          {isCustomPokemon && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              title="Delete Pokemon"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
          
          <div
            style={{ backgroundColor: bgColor }}
            className="h-3/4 w-full flex items-center justify-center rounded-t-xl"
          >
            <Image
              src={image || noImg}
              alt="Pokemon image"
              width={200}
              height={200}
              className="h-5/6 w-auto object-contain"
            />
          </div>
          <div className="h-1/4 w-full flex">
            <div className="w-3/5 h-full pl-3 flex flex-col justify-center">
              <p className="text-black text-sm">
                #{pokemonId ? (pokemonId.toString().length > 5 ? pokemonId.toString().slice(-3) : pokemonId) : '???'}
              </p>
              <h4 className="text-black font-semibold capitalize">{name}</h4>
            </div>
            <div className="w-2/5 h-full flex flex-col items-center justify-evenly mr-2">
              {type?.map((element, i) => (
                <TypeLabel key={i} element={element} />
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Pokemon</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Card;