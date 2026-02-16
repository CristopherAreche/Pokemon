import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminKey } from '@/lib/adminAuth';
import { consumeRateLimit } from '@/lib/rateLimiter';
import { apiLogger } from '@/lib/logger';

interface PokemonData {
  pokemonId: number;
  name: string;
  image: string | null;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  height: number;
  weight: number;
  type: string[];
  is_custom?: boolean;
  created_by?: string | null;
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

interface PokemonListResponse {
  data: PokemonData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ValidatedPokemonInput {
  name: string;
  image: string | null;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  height: number;
  weight: number;
  type: string[];
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 18;
const MAX_PAGE_SIZE = 100;
const REFRESH_RATE_LIMIT = 3;
const REFRESH_RATE_WINDOW_MS = 60_000;
const MAX_NAME_LENGTH = 40;
const MAX_STAT_VALUE = 255;
const MAX_SIZE_VALUE = 5000;
const MAX_ID_GENERATION_ATTEMPTS = 7;

const ALLOWED_TYPES = new Set([
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
  'unknown',
  'shadow',
]);

const SORT_OPTIONS = {
  pokemonId_asc: { column: 'pokemonId', ascending: true },
  pokemonId_desc: { column: 'pokemonId', ascending: false },
  name_asc: { column: 'name', ascending: true },
  name_desc: { column: 'name', ascending: false },
  attack_asc: { column: 'attack', ascending: true },
  attack_desc: { column: 'attack', ascending: false },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const isNoRowsError = (errorCode?: string) => errorCode === 'PGRST116';

const isUniqueConstraintError = (errorCode?: string) => errorCode === '23505';

const getRequestIdentifier = (request: NextRequest) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
};

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseSort = (value: string | null) => {
  const key = (value ?? 'pokemonId_asc') as SortKey;
  return SORT_OPTIONS[key] ?? SORT_OPTIONS.pokemonId_asc;
};

const normalizeSearch = (value: string | null) => {
  if (!value) {
    return '';
  }

  return value.trim().slice(0, 60);
};

const normalizeTypeFilter = (value: string | null): string | null => {
  if (!value || value === 'all') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(normalized)) {
    throw new ValidationError('Invalid type filter.');
  }

  return normalized;
};

const returnUrl = async (url: string): Promise<ApiPokemonResponse> => {
  const urlResponse = await axios.get<ApiPokemonResponse>(url);
  return urlResponse.data;
};

const getPokemonsFromApi = async () => {
  const pokemonData = await axios.get<{ results: ApiPokemonListItem[] }>(
    'https://pokeapi.co/api/v2/pokemon?limit=151'
  );
  return pokemonData.data.results;
};

const getPokemonCount = async () => {
  const { count, error } = await supabaseAdmin
    .from('pokemons')
    .select('pokemonId', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const seedPokemons = async (forceRefresh: boolean) => {
  if (forceRefresh) {
    const { error: deleteError } = await supabaseAdmin
      .from('pokemons')
      .delete()
      .neq('pokemonId', 0);

    if (deleteError) {
      throw deleteError;
    }

    apiLogger.info('pokemons.refresh_cleared');
  }

  const apiPokemons = await getPokemonsFromApi();
  const pokemonList: PokemonData[] = [];
  const batchSize = 25;

  for (let i = 0; i < apiPokemons.length; i += batchSize) {
    const batch = apiPokemons.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (pokemon) => {
        try {
          const urlInfo = await returnUrl(pokemon.url);
          const pokemonData: PokemonData = {
            pokemonId: urlInfo.id,
            name: pokemon.name,
            image:
              urlInfo.sprites?.other?.['official-artwork']?.front_default ??
              urlInfo.sprites?.other?.home?.front_default ??
              urlInfo.sprites?.other?.dream_world?.front_default ??
              urlInfo.sprites?.front_default ??
              `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${urlInfo.id}.png`,
            hp: urlInfo.stats[0]?.base_stat ?? 0,
            attack: urlInfo.stats[1]?.base_stat ?? 0,
            defense: urlInfo.stats[2]?.base_stat ?? 0,
            speed: urlInfo.stats[5]?.base_stat ?? 0,
            height: urlInfo.height ?? 0,
            weight: urlInfo.weight ?? 0,
            type: urlInfo.types.map((t) => t.type.name),
          };

          return pokemonData;
        } catch (error) {
          apiLogger.warn('pokemons.seed_fetch_item_failed', {
            pokemonName: pokemon.name,
            error,
          });
          return null;
        }
      })
    );

    pokemonList.push(...batchResults.filter((pokemon): pokemon is PokemonData => pokemon !== null));
  }

  const insertBatchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < pokemonList.length; i += insertBatchSize) {
    const insertBatch = pokemonList.slice(i, i + insertBatchSize);
    const { data: insertedBatch, error: insertError } = await supabaseAdmin
      .from('pokemons')
      .upsert(insertBatch, { onConflict: 'pokemonId' })
      .select();

    if (insertError) {
      apiLogger.error('pokemons.seed_insert_batch_failed', { insertError });
      continue;
    }

    insertedCount += insertedBatch?.length ?? 0;
  }

  apiLogger.info('pokemons.seed_completed', {
    fetched: pokemonList.length,
    inserted: insertedCount,
  });
};

const getPaginatedPokemons = async (
  page: number,
  pageSize: number,
  search: string,
  typeFilter: string | null,
  sort: (typeof SORT_OPTIONS)[SortKey]
): Promise<PokemonListResponse> => {
  let countQuery = supabaseAdmin
    .from('pokemons')
    .select('pokemonId', { count: 'exact', head: true });

  if (search) {
    countQuery = countQuery.ilike('name', `%${search}%`);
  }

  if (typeFilter) {
    countQuery = countQuery.contains('type', [typeFilter]);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw countError;
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabaseAdmin.from('pokemons').select('*');

  if (search) {
    dataQuery = dataQuery.ilike('name', `%${search}%`);
  }

  if (typeFilter) {
    dataQuery = dataQuery.contains('type', [typeFilter]);
  }

  const { data, error: dataError } = await dataQuery
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (dataError) {
    throw dataError;
  }

  return {
    data: (data ?? []) as PokemonData[],
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNextPage: totalPages > 0 && safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

const normalizeImage = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ValidationError('Image must be a string URL or base64 payload.');
  }

  const normalized = value.trim();

  const isHttpUrl = /^https?:\/\/\S+$/i.test(normalized);
  const isAllowedDataImage = /^data:image\/(png|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(
    normalized
  );

  if (!isHttpUrl && !isAllowedDataImage) {
    throw new ValidationError('Image must be a valid URL or PNG/SVG base64 data image.');
  }

  return normalized;
};

const parseNumberField = (
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum: number
) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new ValidationError(`${fieldName} must be an integer.`);
  }

  if (parsedValue < minimum || parsedValue > maximum) {
    throw new ValidationError(`${fieldName} must be between ${minimum} and ${maximum}.`);
  }

  return parsedValue;
};

const normalizeTypes = (value: unknown): string[] => {
  const rawTypes = Array.isArray(value) ? value : [value];
  const normalizedTypes = rawTypes
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
    .filter(Boolean);
  const uniqueTypes = [...new Set(normalizedTypes)];

  if (uniqueTypes.length < 1 || uniqueTypes.length > 2) {
    throw new ValidationError('Type must include between 1 and 2 values.');
  }

  for (const pokemonType of uniqueTypes) {
    if (!ALLOWED_TYPES.has(pokemonType)) {
      throw new ValidationError(`Invalid type "${pokemonType}".`);
    }
  }

  return uniqueTypes;
};

const validatePokemonInput = (payload: unknown): ValidatedPokemonInput => {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Request body is required.');
  }

  const body = payload as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : '';

  if (!name) {
    throw new ValidationError('Name is required.');
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Name must be at most ${MAX_NAME_LENGTH} characters.`);
  }

  if (!/^[a-zA-Z\s-]+$/.test(name)) {
    throw new ValidationError('Name can only contain letters, spaces, and hyphens.');
  }

  return {
    name,
    image: normalizeImage(body.image),
    hp: parseNumberField(body.hp, 'hp', 0, MAX_STAT_VALUE),
    attack: parseNumberField(body.attack, 'attack', 0, MAX_STAT_VALUE),
    defense: parseNumberField(body.defense, 'defense', 0, MAX_STAT_VALUE),
    speed: parseNumberField(body.speed, 'speed', 0, MAX_STAT_VALUE),
    height: parseNumberField(body.height, 'height', 0, MAX_SIZE_VALUE),
    weight: parseNumberField(body.weight, 'weight', 0, MAX_SIZE_VALUE),
    type: normalizeTypes(body.type),
  };
};

const generatePokemonId = async () => {
  for (let attempt = 0; attempt < MAX_ID_GENERATION_ATTEMPTS; attempt += 1) {
    const candidateId = 100000 + Math.floor(Math.random() * 900000);
    const { data, error } = await supabaseAdmin
      .from('pokemons')
      .select('pokemonId')
      .eq('pokemonId', candidateId)
      .maybeSingle();

    if (error && !isNoRowsError(error.code)) {
      throw error;
    }

    if (!data) {
      return candidateId;
    }
  }

  return null;
};

const shouldRetryInsertWithoutMetadata = (errorCode?: string, message?: string) => {
  if (errorCode === 'PGRST204') {
    return true;
  }

  const normalizedMessage = (message ?? '').toLowerCase();
  return normalizedMessage.includes('is_custom') || normalizedMessage.includes('created_by');
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    const page = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const search = normalizeSearch(searchParams.get('search'));
    const typeFilter = normalizeTypeFilter(searchParams.get('type'));
    const sort = parseSort(searchParams.get('sort'));

    if (forceRefresh) {
      const authResponse = requireAdminKey(request);
      if (authResponse) {
        return authResponse;
      }

      const requester = getRequestIdentifier(request);
      const rateLimit = consumeRateLimit(
        'pokemons_refresh',
        requester,
        REFRESH_RATE_LIMIT,
        REFRESH_RATE_WINDOW_MS
      );

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many refresh attempts. Please try again shortly.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(rateLimit.retryAfterSeconds),
            },
          }
        );
      }
    }

    const currentCount = await getPokemonCount();
    if (currentCount === 0 || forceRefresh) {
      apiLogger.info('pokemons.seed_started', {
        forceRefresh,
        currentCount,
      });
      await seedPokemons(forceRefresh);
    }

    const response = await getPaginatedPokemons(page, pageSize, search, typeFilter, sort);
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    apiLogger.error('pokemons.get_failed', {
      route: '/api/pokemons',
      error,
      forceRefresh,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResponse = requireAdminKey(request);
    if (authResponse) {
      return authResponse;
    }

    let requestData: unknown;

    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const validatedPokemon = validatePokemonInput(requestData);
    const pokemonId = await generatePokemonId();

    if (!pokemonId) {
      return NextResponse.json(
        { error: 'Could not allocate a unique Pokemon ID. Please retry.' },
        { status: 409 }
      );
    }

    const { data: existingName, error: existingNameError } = await supabaseAdmin
      .from('pokemons')
      .select('pokemonId')
      .ilike('name', validatedPokemon.name)
      .limit(1);

    if (existingNameError) {
      throw existingNameError;
    }

    if (existingName && existingName.length > 0) {
      return NextResponse.json({ error: 'Pokemon name already exists.' }, { status: 409 });
    }

    const basePokemonRecord = {
      pokemonId,
      ...validatedPokemon,
    };

    const metadataPokemonRecord = {
      ...basePokemonRecord,
      is_custom: true,
      created_by: request.headers.get('x-user-id') ?? null,
    };

    let insertResult = await supabaseAdmin
      .from('pokemons')
      .insert(metadataPokemonRecord)
      .select()
      .single();

    if (
      insertResult.error &&
      shouldRetryInsertWithoutMetadata(insertResult.error.code, insertResult.error.message)
    ) {
      insertResult = await supabaseAdmin
        .from('pokemons')
        .insert(basePokemonRecord)
        .select()
        .single();
    }

    if (insertResult.error) {
      if (isUniqueConstraintError(insertResult.error.code)) {
        return NextResponse.json(
          { error: 'Pokemon ID collision detected. Please retry.' },
          { status: 409 }
        );
      }

      throw insertResult.error;
    }

    apiLogger.info('pokemons.created', {
      pokemonId: insertResult.data.pokemonId,
      name: insertResult.data.name,
    });

    return NextResponse.json(
      { message: 'Pokemon created successfully', pokemon: insertResult.data },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    apiLogger.error('pokemons.create_failed', {
      route: '/api/pokemons',
      error,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResponse = requireAdminKey(request);
    if (authResponse) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const pokemonId = searchParams.get('id');

    if (!pokemonId) {
      return NextResponse.json({ error: 'Pokemon ID is required.' }, { status: 400 });
    }

    const id = Number.parseInt(pokemonId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Pokemon ID must be a positive integer.' }, { status: 400 });
    }

    const { data: existingPokemon, error: fetchError } = await supabaseAdmin
      .from('pokemons')
      .select('*')
      .eq('pokemonId', id)
      .maybeSingle();

    if (fetchError && !isNoRowsError(fetchError.code)) {
      throw fetchError;
    }

    if (!existingPokemon) {
      return NextResponse.json({ error: 'Pokemon not found.' }, { status: 404 });
    }

    const isCustomPokemon =
      typeof existingPokemon.is_custom === 'boolean' ? existingPokemon.is_custom : id > 151;

    if (!isCustomPokemon) {
      return NextResponse.json({ error: 'Cannot delete original Pokemon.' }, { status: 403 });
    }

    const { count, error: deleteError } = await supabaseAdmin
      .from('pokemons')
      .delete({ count: 'exact' })
      .eq('pokemonId', id);

    if (deleteError) {
      throw deleteError;
    }

    if (!count) {
      return NextResponse.json({ error: 'Pokemon not found.' }, { status: 404 });
    }

    apiLogger.info('pokemons.deleted', { pokemonId: id });
    return NextResponse.json({ message: 'Pokemon deleted successfully.' }, { status: 200 });
  } catch (error: unknown) {
    apiLogger.error('pokemons.delete_failed', {
      route: '/api/pokemons',
      error,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
