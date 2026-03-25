import { NextRequest, NextResponse } from 'next/server';
import { getRequestIdentifier, isValidAdminKey } from '@/lib/adminAuth';
import { attachAdminSessionCookie, clearAdminSessionCookie, hasValidAdminSession } from '@/lib/adminSession';
import { apiLogger } from '@/lib/logger';
import { consumeRateLimit } from '@/lib/rateLimiter';

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 15 * 60_000;

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { authenticated: hasValidAdminSession(request) },
    { status: 200, headers: noStoreHeaders }
  );
}

export async function POST(request: NextRequest) {
  const requester = getRequestIdentifier(request);
  const rateLimit = consumeRateLimit(
    'admin_session_login',
    requester,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          ...noStoreHeaders,
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  let requestData: unknown;

  try {
    requestData = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const body = requestData && typeof requestData === 'object'
    ? (requestData as Record<string, unknown>)
    : null;

  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey : '';

  if (!apiKey.trim()) {
    return NextResponse.json(
      { error: 'Admin key is required.' },
      { status: 400, headers: noStoreHeaders }
    );
  }

  if (!isValidAdminKey(apiKey)) {
    apiLogger.warn('auth.admin_session_denied', {
      route: request.nextUrl.pathname,
      requester,
    });

    return NextResponse.json(
      { error: 'Unauthorized. Missing or invalid admin credentials.' },
      { status: 401, headers: noStoreHeaders }
    );
  }

  const response = NextResponse.json(
    { authenticated: true },
    { status: 200, headers: noStoreHeaders }
  );

  attachAdminSessionCookie(response);

  apiLogger.info('auth.admin_session_created', {
    route: request.nextUrl.pathname,
    requester,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json(
    { authenticated: false },
    { status: 200, headers: noStoreHeaders }
  );

  clearAdminSessionCookie(response);

  apiLogger.info('auth.admin_session_cleared', {
    route: request.nextUrl.pathname,
    requester: getRequestIdentifier(request),
  });

  return response;
}
