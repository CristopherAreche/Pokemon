import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

interface TypeApiResponse {
  name: string;
  url: string;
}

interface TypesApiData {
  results: TypeApiResponse[];
}

interface DatabaseType {
  name: string;
}

const getTypes = async () => {
  try {
    const apiUrl = "https://pokeapi.co/api/v2/type";
    const response = await axios.get<TypesApiData>(apiUrl);
    const types = response.data.results.map((type) => type.name);
    return types;
  } catch {
    throw new Error("Error to obtain pokemon types from api.");
  }
};

export async function GET() {
  try {
    // First check if we have types in database
    const { data: typesFromDb, error: fetchError } = await supabaseAdmin
      .from('types')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    if (typesFromDb && typesFromDb.length > 0) {
      const typeNames = typesFromDb.map((type: DatabaseType) => type.name);
      return NextResponse.json(typeNames);
    }

    // If no types in database, fetch from API and store
    apiLogger.info('types.seed_started');
    const typesFromAPI = await getTypes();
    
    if (typesFromAPI && typesFromAPI.length > 0) {
      // Insert types into database
      const typeObjects = typesFromAPI.map((typeName: string) => ({ name: typeName }));
      
      const { data: insertedTypes, error: insertError } = await supabaseAdmin
        .from('types')
        .insert(typeObjects)
        .select();

      if (insertError) {
        apiLogger.warn('types.seed_insert_failed', { insertError });
        // Return API data even if insert fails
        return NextResponse.json(typesFromAPI);
      }

      const typeNames = insertedTypes.map((type: DatabaseType) => type.name);
      return NextResponse.json(typeNames);
    } else {
      return NextResponse.json([]);
    }
  } catch (error: unknown) {
    apiLogger.error('types.get_failed', { route: '/api/types', error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
