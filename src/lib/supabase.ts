import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabaseConfig";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
};

// Client for browser/frontend usage
export const supabase = getSupabaseBrowserClient();

// Types for our database tables
export interface Pokemon {
  pokemonId: number
  name: string
  image?: string
  hp?: number
  attack?: number
  defense?: number
  speed?: number
  height?: number
  weight?: number
  type: string[]
}

export interface PokemonType {
  id: number
  name: string
}
