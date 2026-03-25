import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { hasValidAdminSession } from '@/lib/adminSession';
import { apiLogger } from '@/lib/logger';

export const ADMIN_HEADER_NAME = 'x-admin-key';

interface RequireAdminAccessOptions {
  allowHeader?: boolean;
  allowSession?: boolean;
  enforceSameOriginForSession?: boolean;
}

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const isTrustedSameOriginRequest = (request: NextRequest) => {
  const expectedOrigin = request.nextUrl.origin;
  const origin = request.headers.get('origin');

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get('referer');
  return Boolean(referer && referer.startsWith(expectedOrigin));
};

export const isValidAdminKey = (providedAdminKey: string | null | undefined) => {
  const configuredAdminKey = process.env.ADMIN_API_KEY?.trim();

  if (!configuredAdminKey || !providedAdminKey?.trim()) {
    return false;
  }

  return safeCompare(configuredAdminKey, providedAdminKey.trim());
};

export const getRequestIdentifier = (request: NextRequest) => {
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

export const requireAdminAccess = (
  request: NextRequest,
  options: RequireAdminAccessOptions = {}
): NextResponse | null => {
  const {
    allowHeader = true,
    allowSession = true,
    enforceSameOriginForSession = true,
  } = options;

  if (allowSession && hasValidAdminSession(request)) {
    if (enforceSameOriginForSession && !isTrustedSameOriginRequest(request)) {
      apiLogger.warn('auth.admin_session_forbidden_origin', {
        route: request.nextUrl.pathname,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });

      return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
    }

    return null;
  }

  if (allowHeader && isValidAdminKey(request.headers.get(ADMIN_HEADER_NAME))) {
    return null;
  }

  apiLogger.warn('auth.admin_access_denied', {
    route: request.nextUrl.pathname,
    hasSession: hasValidAdminSession(request),
    hasProvidedKey: Boolean(request.headers.get(ADMIN_HEADER_NAME)?.trim()),
    hasConfiguredKey: Boolean(process.env.ADMIN_API_KEY?.trim()),
  });

  return NextResponse.json(
    { error: 'Unauthorized. Missing or invalid admin credentials.' },
    { status: 401 }
  );
};

export const requireAdminKey = (request: NextRequest): NextResponse | null => {
  return requireAdminAccess(request, {
    allowSession: false,
    allowHeader: true,
    enforceSameOriginForSession: false,
  });
};
