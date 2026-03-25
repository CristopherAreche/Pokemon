import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { apiLogger } from "@/lib/logger";

interface FavoriteRow {
  pokemon_id: number;
  created_at: string;
}

const parsePokemonId = (value: unknown) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const getAuthenticatedUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return {
    supabase,
    user,
  };
};

export async function GET(request: NextRequest) {
  try {
    const idsOnly = new URL(request.url).searchParams.get("idsOnly") === "true";
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select("pokemon_id, created_at")
      .order("created_at", { ascending: false });

    if (favoritesError) {
      throw favoritesError;
    }

    const favoriteRows = (favorites ?? []) as FavoriteRow[];
    const favoriteIds = favoriteRows.map((favorite) => favorite.pokemon_id);

    if (idsOnly || favoriteIds.length === 0) {
      return NextResponse.json({
        favoriteIds,
        favorites: [],
      });
    }

    const { data: pokemons, error: pokemonsError } = await supabaseAdmin
      .from("pokemons")
      .select("*")
      .in("pokemonId", favoriteIds);

    if (pokemonsError) {
      throw pokemonsError;
    }

    const pokemonById = new Map((pokemons ?? []).map((pokemon) => [pokemon.pokemonId, pokemon]));
    const orderedFavorites = favoriteIds
      .map((favoriteId) => pokemonById.get(favoriteId))
      .filter(Boolean);

    return NextResponse.json({
      favoriteIds,
      favorites: orderedFavorites,
    });
  } catch (error) {
    apiLogger.error("favorites.list_failed", {
      route: "/api/favorites",
      error,
    });

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let requestData: unknown;

    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const pokemonId = parsePokemonId((requestData as { pokemonId?: unknown })?.pokemonId);

    if (!pokemonId) {
      return NextResponse.json({ error: "A valid pokemonId is required." }, { status: 400 });
    }

    const { data: pokemon, error: pokemonError } = await supabaseAdmin
      .from("pokemons")
      .select("pokemonId")
      .eq("pokemonId", pokemonId)
      .maybeSingle();

    if (pokemonError) {
      throw pokemonError;
    }

    if (!pokemon) {
      return NextResponse.json({ error: "Pokemon not found." }, { status: 404 });
    }

    const { error: insertError } = await supabase.from("favorites").insert({
      user_id: user.id,
      pokemon_id: pokemonId,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { message: "Pokemon is already in favorites.", pokemonId },
          { status: 200 }
        );
      }

      throw insertError;
    }

    return NextResponse.json({ message: "Pokemon added to favorites.", pokemonId }, { status: 201 });
  } catch (error) {
    apiLogger.error("favorites.create_failed", {
      route: "/api/favorites",
      error,
    });

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
