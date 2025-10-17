import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';

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
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
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

      return NextResponse.json([pokemon]);
    } catch (apiError) {
      return NextResponse.json({ error: "Pokemon not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error filtering Pokemon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}