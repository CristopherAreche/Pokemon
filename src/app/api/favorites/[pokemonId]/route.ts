import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { apiLogger } from "@/lib/logger";

const parsePokemonId = (value: string) => {
  const parsedValue = Number.parseInt(value, 10);

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pokemonId: string }> }
) {
  try {
    const { pokemonId: pokemonIdParam } = await params;
    const pokemonId = parsePokemonId(pokemonIdParam);

    if (!pokemonId) {
      return NextResponse.json({ error: "Invalid Pokemon ID." }, { status: 400 });
    }

    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("favorites")
      .select("pokemon_id", { count: "exact", head: true })
      .eq("pokemon_id", pokemonId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ isFavorite: (count ?? 0) > 0 });
  } catch (error) {
    apiLogger.error("favorites.status_failed", {
      route: "/api/favorites/[pokemonId]",
      error,
    });

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pokemonId: string }> }
) {
  try {
    const { pokemonId: pokemonIdParam } = await params;
    const pokemonId = parsePokemonId(pokemonIdParam);

    if (!pokemonId) {
      return NextResponse.json({ error: "Invalid Pokemon ID." }, { status: 400 });
    }

    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("favorites")
      .delete({ count: "exact" })
      .eq("pokemon_id", pokemonId);

    if (error) {
      throw error;
    }

    if (!count) {
      return NextResponse.json({ error: "Favorite not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Pokemon removed from favorites.", pokemonId });
  } catch (error) {
    apiLogger.error("favorites.delete_failed", {
      route: "/api/favorites/[pokemonId]",
      error,
    });

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
