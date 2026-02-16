"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import { background } from "@/assets/backgroundColorByType";
import wallpaperImg from "@/images/wallpaper.jpg";
import axios from "axios";

export default function CreatePage() {
  const router = useRouter();
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    hp: "",
    attack: "",
    defense: "",
    speed: "",
    height: "",
    weight: "",
    type: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const [statErrors, setStatErrors] = useState({
    hp: "",
    attack: "",
    defense: "",
    speed: ""
  });

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  const validateName = (name: string) => {
    // Only letters and spaces allowed, max 40 characters
    const nameRegex = /^[a-zA-Z\s]*$/;
    
    if (name.length > 40) {
      return "Name must be 40 characters or less";
    }
    
    if (!nameRegex.test(name)) {
      return "Name can only contain letters and spaces";
    }
    
    if (name.trim().length === 0) {
      return "Name is required";
    }
    
    return "";
  };

  const validateStat = (value: string, statName: string) => {
    if (value === "") return "";
    
    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      return `${statName} must be a number`;
    }
    
    if (numValue < 0) {
      return `${statName} cannot be negative`;
    }
    
    if (numValue > 100) {
      return `${statName} cannot exceed 100`;
    }
    
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "name") {
      const error = validateName(value);
      setNameError(error);
    }
    
    // Validate stat inputs
    if (["hp", "attack", "defense", "speed"].includes(name)) {
      const statName = name.charAt(0).toUpperCase() + name.slice(1);
      const error = validateStat(value, statName);
      setStatErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type].slice(0, 2) // Limit to 2 types
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PNG or SVG file only.');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    // Validate stats
    const newStatErrors = {
      hp: validateStat(formData.hp, "HP"),
      attack: validateStat(formData.attack, "Attack"),
      defense: validateStat(formData.defense, "Defense"),
      speed: validateStat(formData.speed, "Speed")
    };
    
    const hasStatErrors = Object.values(newStatErrors).some(error => error !== "");
    if (hasStatErrors) {
      setStatErrors(newStatErrors);
      return;
    }

    if (formData.type.length === 0) {
      alert("Please select at least one type!");
      return;
    }

    let imageData = "";
    
    // Convert file to base64 if a file is selected
    if (selectedFile) {
      try {
        imageData = await convertFileToBase64(selectedFile);
      } catch {
        alert("Error processing image file.");
        return;
      }
    }

    const pokemonData = {
      ...formData,
      image: imageData || formData.image,
      hp: parseInt(formData.hp) || 0,
      attack: parseInt(formData.attack) || 0,
      defense: parseInt(formData.defense) || 0,
      speed: parseInt(formData.speed) || 0,
      height: parseInt(formData.height) || 0,
      weight: parseInt(formData.weight) || 0,
    };

    try {
      setIsSubmitting(true);
      setShowLoadingModal(true);
      console.log("Sending Pokemon data:", { ...pokemonData, image: imageData ? "base64 image data" : "no image" });

      if (!adminKey) {
        throw new Error(
          "Missing NEXT_PUBLIC_ADMIN_API_KEY. Configure it to create Pokémon from the UI."
        );
      }

      const response = await axios.post("/api/pokemons", pokemonData, {
        headers: {
          "x-admin-key": adminKey,
        },
      });
      
      if (response.status === 201) {
        const createdPokemon = response.data.pokemon;
        
        // Show loading for 3 seconds
        setTimeout(() => {
          setShowLoadingModal(false);
          // Navigate to the created Pokemon's detail page
          router.push(`/detail/${createdPokemon.pokemonId}`);
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Error creating Pokemon:", error);
      
      let errorMessage = "Failed to create Pokemon";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || "Failed to create Pokemon";
      }
      
      setShowLoadingModal(false);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${wallpaperImg.src})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Navbar />
      <div className="pt-24 px-4 pb-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white text-center mb-8">
              Create New Pokémon
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Name * (Letters and spaces only, max 40 characters)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent ${
                    nameError 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter Pokémon name"
                  maxLength={40}
                  required
                />
                {nameError && (
                  <p className="text-red-300 text-sm mt-1">{nameError}</p>
                )}
                <p className="text-gray-300 text-xs mt-1">
                  {formData.name.length}/40 characters
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Pokemon Image (PNG or SVG only)
                </label>
                <input
                  type="file"
                  accept=".png,.svg,image/png,image/svg+xml"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                {imagePreview && (
                  <div className="mt-4 flex justify-center">
                    <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-md relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">HP (Max: 100)</label>
                  <input
                    type="number"
                    name="hp"
                    value={formData.hp}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent ${
                      statErrors.hp 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    min="0"
                    max="100"
                  />
                  {statErrors.hp && (
                    <p className="text-red-300 text-sm mt-1">{statErrors.hp}</p>
                  )}
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Attack (Max: 100)</label>
                  <input
                    type="number"
                    name="attack"
                    value={formData.attack}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent ${
                      statErrors.attack 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    min="0"
                    max="100"
                  />
                  {statErrors.attack && (
                    <p className="text-red-300 text-sm mt-1">{statErrors.attack}</p>
                  )}
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Defense (Max: 100)</label>
                  <input
                    type="number"
                    name="defense"
                    value={formData.defense}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent ${
                      statErrors.defense 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    min="0"
                    max="100"
                  />
                  {statErrors.defense && (
                    <p className="text-red-300 text-sm mt-1">{statErrors.defense}</p>
                  )}
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Speed (Max: 100)</label>
                  <input
                    type="number"
                    name="speed"
                    value={formData.speed}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent ${
                      statErrors.speed 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    min="0"
                    max="100"
                  />
                  {statErrors.speed && (
                    <p className="text-red-300 text-sm mt-1">{statErrors.speed}</p>
                  )}
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              {/* Types */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Types * (Select 1-2)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {pokemonTypes.map((type) => {
                    const typeColors = background[type as keyof typeof background] || background.normal;
                    const isSelected = formData.type.includes(type);
                    
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          isSelected
                            ? "border-white shadow-lg scale-105"
                            : "border-transparent hover:border-white/50 hover:scale-102"
                        }`}
                        style={{ 
                          backgroundColor: typeColors[0], 
                          color: typeColors[1]
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create Pokémon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Creating Your Pokémon!</h3>
            <p className="text-gray-600">Please wait while we bring your Pokémon to life...</p>
          </div>
        </div>
      )}
    </div>
  );
}
