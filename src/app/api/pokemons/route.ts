import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';

interface PokemonData {
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

interface ApiPokemonResponse {
  id: number;
  name: string;
  sprites: PokemonSprites;
  stats: Array<{ base_stat: number }>;
  types: Array<{ type: { name: string } }>;
  height: number;
  weight: number;
}

interface ApiPokemonListItem {
  name: string;
  url: string;
}

const returnUrl = async (url: string): Promise<ApiPokemonResponse> => {
  const urlResponse = await axios(url);
  return urlResponse.data;
};

const getPokemonsFromApi = async () => {
  const pokemonData = await axios.get(
    `https://pokeapi.co/api/v2/pokemon?limit=151`
  );
  return pokemonData;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Check if we already have Pokemon in the database
    const { data: existingPokemons, error: fetchError } = await supabaseAdmin
      .from('pokemons')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    // If we have Pokemon and not forcing refresh, return them
    if (existingPokemons && existingPokemons.length > 0 && !forceRefresh) {
      console.log(`Returning ${existingPokemons.length} existing Pokemon from database`);
      return NextResponse.json(existingPokemons);
    }

    // If forcing refresh, delete existing Pokemon first
    if (forceRefresh && existingPokemons && existingPokemons.length > 0) {
      console.log('Deleting existing Pokemon for refresh...');
      await supabaseAdmin.from('pokemons').delete().neq('pokemonId', 0);
    }

    // If no Pokemon in database, fetch from API
    console.log('No Pokemon found, fetching from API...');
    const apiData = await getPokemonsFromApi();
    const apiPokemons = apiData.data.results.map((pokemon: ApiPokemonListItem) => ({
      name: pokemon?.name ?? "Unknown",
      url: pokemon.url,
    }));

    // Process Pokemon in batches to avoid timeout
    const batchSize = 25;
    const pokemonList = [];
    
    for (let i = 0; i < apiPokemons.length; i += batchSize) {
      const batch = apiPokemons.slice(i, i + batchSize);
      console.log(`Fetching Pokemon batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(apiPokemons.length / batchSize)}`);
      
      const batchResults = await Promise.all(
        batch.map(async (pokemon: ApiPokemonListItem) => {
          try {
            const urlInfo = await returnUrl(pokemon.url);
            const pokemonData: PokemonData = {
              pokemonId: urlInfo.id,
              name: pokemon.name,
              image: urlInfo.sprites?.other?.['official-artwork']?.front_default || 
                     urlInfo.sprites?.other?.home?.front_default || 
                     urlInfo.sprites?.other?.dream_world?.front_default || 
                     urlInfo.sprites?.front_default ||
                     `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${urlInfo.id}.png`,
              hp: urlInfo.stats[0]?.base_stat || 0,
              attack: urlInfo.stats[1]?.base_stat || 0,
              defense: urlInfo.stats[2]?.base_stat || 0,
              speed: urlInfo.stats[5]?.base_stat || 0,
              height: urlInfo.height || 0,
              weight: urlInfo.weight || 0,
              type: urlInfo.types.map((t) => t.type.name),
            };
            return pokemonData;
          } catch (error) {
            console.error(`Error fetching Pokemon ${pokemon.name}:`, error);
            return null;
          }
        })
      );
      
      pokemonList.push(...batchResults);
    }

    const validPokemons = pokemonList.filter(p => p !== null) as PokemonData[];

    // Insert into Supabase in batches
    const insertBatchSize = 50;
    const allInsertedPokemons = [];
    
    for (let i = 0; i < validPokemons.length; i += insertBatchSize) {
      const insertBatch = validPokemons.slice(i, i + insertBatchSize);
      console.log(`Inserting Pokemon batch ${Math.floor(i / insertBatchSize) + 1}/${Math.ceil(validPokemons.length / insertBatchSize)}`);
      
      const { data: insertedBatch, error: insertError } = await supabaseAdmin
        .from('pokemons')
        .insert(insertBatch)
        .select();

      if (insertError) {
        console.error('Insert error for batch:', insertError);
      } else {
        allInsertedPokemons.push(...(insertedBatch || []));
      }
    }

    console.log(`Successfully inserted ${allInsertedPokemons.length} Pokemon into database`);
    return NextResponse.json(allInsertedPokemons.length > 0 ? allInsertedPokemons : validPokemons);
  } catch (error: unknown) {
    console.error('Error in GET /api/pokemons:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    console.log('Received Pokemon creation request:', requestData);
    const { name, image, hp, attack, defense, speed, height, weight, type } = requestData;
    
    // Generate a safe integer ID (using last 6 digits of timestamp + random number)
    const timestamp = Date.now();
    const pokemonId = parseInt(timestamp.toString().slice(-6)) + Math.floor(Math.random() * 1000);
    
    const pokemon = {
      pokemonId,
      name,
      image: image || null,
      hp: parseInt(hp) || 0,
      attack: parseInt(attack) || 0,
      defense: parseInt(defense) || 0,
      speed: parseInt(speed) || 0,
      height: parseInt(height) || 0,
      weight: parseInt(weight) || 0,
      type: Array.isArray(type) ? type : [type],
    };

    const { data, error } = await supabaseAdmin
      .from('pokemons')
      .insert(pokemon)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Pokemon created successfully", pokemon: data }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating Pokemon:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pokemonId = searchParams.get('id');
    
    if (!pokemonId) {
      return NextResponse.json({ error: 'Pokemon ID is required' }, { status: 400 });
    }

    const id = parseInt(pokemonId);
    
    // Only allow deletion of custom Pokemon (ID > 151)
    if (id <= 151) {
      return NextResponse.json({ error: 'Cannot delete original Pokemon' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('pokemons')
      .delete()
      .eq('pokemonId', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Pokemon deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting Pokemon:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}