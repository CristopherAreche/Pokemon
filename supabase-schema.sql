-- Enable the pgcrypto extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the pokemons table
CREATE TABLE IF NOT EXISTS pokemons (
    "pokemonId" INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    image VARCHAR,
    hp INTEGER,
    attack INTEGER,
    defense INTEGER,
    speed INTEGER,
    height INTEGER,
    weight INTEGER,
    type TEXT[] DEFAULT '{}'
);

-- Create the types table
CREATE TABLE IF NOT EXISTS types (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pokemons_name ON pokemons(name);
CREATE INDEX IF NOT EXISTS idx_pokemons_type ON pokemons USING GIN(type);
CREATE INDEX IF NOT EXISTS idx_types_name ON types(name);

-- Insert some sample types (optional)
INSERT INTO types (name) VALUES 
    ('normal'), ('fighting'), ('flying'), ('poison'), ('ground'),
    ('rock'), ('bug'), ('ghost'), ('steel'), ('fire'),
    ('water'), ('grass'), ('electric'), ('psychic'), ('ice'),
    ('dragon'), ('dark'), ('fairy')
ON CONFLICT (name) DO NOTHING;