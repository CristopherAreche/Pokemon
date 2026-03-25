-- Enable the pgcrypto extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create or update the pokemons table
CREATE TABLE IF NOT EXISTS pokemons (
    "pokemonId" INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    image TEXT,
    hp INTEGER,
    attack INTEGER,
    defense INTEGER,
    speed INTEGER,
    height INTEGER,
    weight INTEGER,
    type TEXT[] DEFAULT '{}',
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill/align columns for existing tables
ALTER TABLE pokemons ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pokemons ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE pokemons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE pokemons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE pokemons SET is_custom = TRUE WHERE "pokemonId" > 151 AND is_custom = FALSE;
UPDATE pokemons SET created_at = NOW() WHERE created_at IS NULL;
UPDATE pokemons SET updated_at = NOW() WHERE updated_at IS NULL;

-- Keep updated_at synchronized automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pokemons_updated_at ON pokemons;
CREATE TRIGGER trg_pokemons_updated_at
BEFORE UPDATE ON pokemons
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create the types table
CREATE TABLE IF NOT EXISTS types (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE
);

-- User profiles keyed to Supabase Auth users.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites owned by individual users.
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pokemon_id INTEGER NOT NULL REFERENCES public.pokemons("pokemonId") ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, pokemon_id)
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Keep profiles in sync with new auth users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
            NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
            NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any users created before the trigger existed.
INSERT INTO public.profiles (id, display_name)
SELECT
    users.id,
    COALESCE(
        NULLIF(users.raw_user_meta_data ->> 'display_name', ''),
        NULLIF(users.raw_user_meta_data ->> 'name', ''),
        NULLIF(split_part(COALESCE(users.email, ''), '@', 1), '')
    )
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pokemons_name ON pokemons(name);
CREATE INDEX IF NOT EXISTS idx_pokemons_type ON pokemons USING GIN(type);
CREATE INDEX IF NOT EXISTS idx_pokemons_is_custom ON pokemons(is_custom);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pokemons_custom_name_unique
    ON pokemons ((LOWER(name)))
    WHERE is_custom = TRUE;
CREATE INDEX IF NOT EXISTS idx_types_name ON types(name);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pokemon_id ON favorites(pokemon_id);

-- Insert some sample types (optional)
INSERT INTO types (name) VALUES 
    ('normal'), ('fighting'), ('flying'), ('poison'), ('ground'),
    ('rock'), ('bug'), ('ghost'), ('steel'), ('fire'),
    ('water'), ('grass'), ('electric'), ('psychic'), ('ice'),
    ('dragon'), ('dark'), ('fairy')
ON CONFLICT (name) DO NOTHING;

-- Create a private schema for future server-only database objects.
-- Objects here are not exposed via the Supabase Data API unless you explicitly expose the schema.
CREATE SCHEMA IF NOT EXISTS private;

-- Security hardening for tables exposed through the Supabase Data API.
-- Supabase recommends enabling RLS on every table in the public schema.
ALTER TABLE public.pokemons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Restrict direct Data API privileges to the minimum required.
-- The app uses the service role from Next.js API routes, so public write access is unnecessary.
REVOKE ALL ON TABLE public.pokemons FROM anon, authenticated;
REVOKE ALL ON TABLE public.types FROM anon, authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.favorites FROM anon, authenticated;

-- Keep read-only access on types so the keepalive workflow can still perform a safe SELECT.
GRANT SELECT ON TABLE public.types TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.favorites TO authenticated;

-- Explicit policies make the access model obvious and avoid leaving behavior implicit.
DROP POLICY IF EXISTS "No direct public access to pokemons" ON public.pokemons;
CREATE POLICY "No direct public access to pokemons"
ON public.pokemons
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);

DROP POLICY IF EXISTS "Public read access to pokemon types" ON public.types;
CREATE POLICY "Public read access to pokemon types"
ON public.types
FOR SELECT
TO anon, authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites"
ON public.favorites
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
CREATE POLICY "Users can add their own favorites"
ON public.favorites
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can delete their own favorites"
ON public.favorites
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Prevent future "RLS Disabled in Public" findings when tables are created via raw SQL.
CREATE OR REPLACE FUNCTION private.rls_auto_enable()
RETURNS EVENT_TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    cmd RECORD;
BEGIN
    FOR cmd IN
        SELECT *
        FROM pg_event_trigger_ddl_commands()
        WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
          AND object_type IN ('table', 'partitioned table')
    LOOP
        IF cmd.schema_name = 'public' THEN
            BEGIN
                EXECUTE format(
                    'ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY',
                    cmd.object_identity
                );
                RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
            END;
        END IF;
    END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ensure_public_rls;
CREATE EVENT TRIGGER ensure_public_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION private.rls_auto_enable();
