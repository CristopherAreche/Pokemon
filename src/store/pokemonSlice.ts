import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface Pokemon {
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

interface PokemonState {
  pokemons: Pokemon[];
  pokemon: Pokemon | null;
  types: string[];
  length: number;
  loading: boolean;
  error: string | null;
}

const initialState: PokemonState = {
  pokemons: [],
  pokemon: null,
  types: [],
  length: 0,
  loading: false,
  error: null,
};

// Async thunk for getting all pokemon
export const getAllPokemon = createAsyncThunk(
  "pokemon/getAllPokemon",
  async () => {
    const apiData = await axios.get(`${API_URL}/pokemons`);
    return apiData.data;
  }
);

// Async thunk for getting a pokemon by ID
export const getPokemon = createAsyncThunk(
  "pokemon/getPokemon", 
  async (id: string | number) => {
    const apiData = await axios.get(`${API_URL}/pokemons/${id}`);
    return apiData.data;
  }
);

// Async thunk for getting pokemon types
export const getTypes = createAsyncThunk("pokemon/getTypes", async () => {
  const apiDataTypes = await axios.get(`${API_URL}/types`);
  return apiDataTypes.data;
});

// Async thunk for filtering pokemon by type
export const getFilterType = createAsyncThunk(
  "pokemon/getFilterType",
  async (type: string) => {
    const apiDataTypes = await axios.get(`${API_URL}/pokemons`);
    const data = apiDataTypes.data;
    const response = data?.filter((e: Pokemon) => e.type?.includes(type));

    if (response) {
      return response;
    } else {
      alert("This Pokemon type is not on the list");
      return data;
    }
  }
);

// Async thunk for getting pokemon filtered by name
export const getPokemonByName = createAsyncThunk(
  "pokemon/getPokemonByName",
  async (name: string) => {
    try {
      const response = await axios.get(`${API_URL}/pokemons/search?name=${name}`);
      const pokeFilter = response.data;
      
      if (!pokeFilter.length) {
        // Using browser alert since sweetalert would need additional setup
        alert("Pokemon not found");
        return { pokeFilter: [], length: 0 };
      } else {
        return { pokeFilter, length: pokeFilter.length };
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

// Create pokemon slice
const pokemonSlice = createSlice({
  name: "pokemon",
  initialState,
  reducers: {
    setFilteredPokemons: (state, action) => {
      state.pokemons = action.payload;
    },
    damageOrder: (state, action) => {
      const { payload: damageOrder } = action;

      let orderDamage;

      if (damageOrder === "max") {
        orderDamage = state.pokemons.slice().sort((a, b) => (b.attack || 0) - (a.attack || 0));
      } else if (damageOrder === "min") {
        orderDamage = state.pokemons.slice().sort((a, b) => (a.attack || 0) - (b.attack || 0));
      } else if (damageOrder === "default") {
        orderDamage = state.pokemons.slice().sort((a, b) => a.pokemonId - b.pokemonId);
      }

      if (orderDamage) {
        state.pokemons = orderDamage;
      }
    },
    pokemonOrder: (state, action) => {
      const { payload: order } = action;

      let pokeOrder;

      if (order === "asc") {
        pokeOrder = state.pokemons.slice().sort((a, b) => a.name.localeCompare(b.name));
      } else if (order === "desc") {
        pokeOrder = state.pokemons.slice().sort((a, b) => b.name.localeCompare(a.name));
      } else if (order === "default") {
        pokeOrder = state.pokemons.slice().sort((a, b) => a.pokemonId - b.pokemonId);
      }

      if (pokeOrder) {
        state.pokemons = pokeOrder;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPokemon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPokemon.fulfilled, (state, action) => {
        state.loading = false;
        state.pokemons = action.payload;
      })
      .addCase(getAllPokemon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch pokemon";
      })
      .addCase(getPokemon.fulfilled, (state, action) => {
        state.pokemon = action.payload;
      })
      .addCase(getFilterType.fulfilled, (state, action) => {
        state.pokemons = action.payload;
      })
      .addCase(getTypes.fulfilled, (state, action) => {
        state.types = action.payload;
      })
      .addCase(getPokemonByName.fulfilled, (state, action) => {
        state.pokemons = action.payload.pokeFilter;
        state.length = action.payload.length;
      });
  },
});

export const { setFilteredPokemons, damageOrder, pokemonOrder } =
  pokemonSlice.actions;

export default pokemonSlice.reducer;