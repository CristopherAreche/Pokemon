import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';

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
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const apiData = response.data;
    
    const pokemon = {
      pokemonId: apiData.id,
      name: apiData.name,
      image: (apiData.sprites as any)?.other?.['official-artwork']?.front_default || 
             (apiData.sprites as any)?.other?.home?.front_default || 
             apiData.sprites?.other?.dream_world?.front_default || 
             (apiData.sprites as any)?.front_default ||
             `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${apiData.id}.png`,
      hp: apiData.stats[0]?.base_stat || 0,
      attack: apiData.stats[1]?.base_stat || 0,
      defense: apiData.stats[2]?.base_stat || 0,
      speed: apiData.stats[5]?.base_stat || 0,
      height: apiData.height || 0,
      weight: apiData.weight || 0,
      type: apiData.types.map((t: any) => t.type.name),
    };

    return NextResponse.json(pokemon);
  } catch (error: any) {
    console.error('Error searching Pokemon by ID:', error);
    return NextResponse.json({ error: "Pokemon not found" }, { status: 500 });
  }
}