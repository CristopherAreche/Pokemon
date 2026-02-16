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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pokemons_name ON pokemons(name);
CREATE INDEX IF NOT EXISTS idx_pokemons_type ON pokemons USING GIN(type);
CREATE INDEX IF NOT EXISTS idx_pokemons_is_custom ON pokemons(is_custom);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pokemons_custom_name_unique
    ON pokemons ((LOWER(name)))
    WHERE is_custom = TRUE;
CREATE INDEX IF NOT EXISTS idx_types_name ON types(name);

-- Insert some sample types (optional)
INSERT INTO types (name) VALUES 
    ('normal'), ('fighting'), ('flying'), ('poison'), ('ground'),
    ('rock'), ('bug'), ('ghost'), ('steel'), ('fire'),
    ('water'), ('grass'), ('electric'), ('psychic'), ('ice'),
    ('dragon'), ('dark'), ('fairy')
ON CONFLICT (name) DO NOTHING;
