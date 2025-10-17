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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: "Name parameter is required" }, { status: 400 });
    }

    // Search in database first
    const { data: dbResults, error: dbError } = await supabaseAdmin
      .from('pokemons')
      .select('*')
      .ilike('name', `%${name}%`);

    if (!dbError && dbResults && dbResults.length > 0) {
      return NextResponse.json(dbResults);
    }

    // If not found in database, try API
    try {
      const response = await axios.get<PokemonApiResponse>(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
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
        type: apiData.types.map((t) => t.type.name),
      };

      return NextResponse.json([pokemon]);
    } catch {
      return NextResponse.json({ error: "Pokemon not found" }, { status: 404 });
    }
  } catch (error: unknown) {
    console.error('Error filtering Pokemon:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}