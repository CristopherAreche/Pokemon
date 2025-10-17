import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';

interface PokemonSprites {
  front_default?: string;
  other?: {
    'official-artwork'?: {
      front_default?: string;
    };
    home?: {
      front_default?: string;
    };
    dream_world?: {
      front_default?: string;
    };
  };
}

interface PokemonStat {
  base_stat: number;
}

interface PokemonType {
  type: {
    name: string;
  };
}

interface PokemonApiResponse {
  id: number;
  name: string;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  height: number;
  weight: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Pokemon ID" }, { status: 400 });
    }

    // First check database
    const { data: pokemonFromDB, error: dbError } = await supabaseAdmin
      .from('pokemons')
      .select('*')
      .eq('pokemonId', id)
      .single();

    if (!dbError && pokemonFromDB) {
      return NextResponse.json(pokemonFromDB);
    }

    // If not in database, fetch from API
    const response = await axios.get<PokemonApiResponse>(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const apiData = response.data;
    
    const pokemon = {
      pokemonId: apiData.id,
      name: apiData.name,
      image: apiData.sprites?.other?.['official-artwork']?.front_default || 
             apiData.sprites?.other?.home?.front_default || 
             apiData.sprites?.other?.dream_world?.front_default || 
             apiData.sprites?.front_default ||
             `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${apiData.id}.png`,
      hp: apiData.stats[0]?.base_stat || 0,
      attack: apiData.stats[1]?.base_stat || 0,
      defense: apiData.stats[2]?.base_stat || 0,
      speed: apiData.stats[5]?.base_stat || 0,
      height: apiData.height || 0,
      weight: apiData.weight || 0,
      type: apiData.types.map((t: PokemonType) => t.type.name),
    };

    return NextResponse.json(pokemon);
  } catch (error: unknown) {
    console.error('Error searching Pokemon by ID:', error);
    const errorMessage = error instanceof Error ? error.message : "Pokemon not found";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}