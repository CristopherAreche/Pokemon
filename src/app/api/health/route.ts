import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  const startedAt = Date.now();

  try {
    const { error } = await supabaseAdmin.from('pokemons').select('pokemonId').limit(1);

    if (error) {
      apiLogger.warn('healthcheck.db_degraded', { error });
      return NextResponse.json(
        {
          status: 'degraded',
          service: 'pokemon-fullstack',
          database: 'unhealthy',
          checkedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        service: 'pokemon-fullstack',
        database: 'healthy',
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    apiLogger.error('healthcheck.failed', { error });
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'pokemon-fullstack',
        database: 'unknown',
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}

