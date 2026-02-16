import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

export const ADMIN_HEADER_NAME = 'x-admin-key';

export const requireAdminKey = (request: NextRequest): NextResponse | null => {
  const configuredAdminKey = process.env.ADMIN_API_KEY?.trim();
  const providedAdminKey = request.headers.get(ADMIN_HEADER_NAME)?.trim();

  if (!configuredAdminKey || !providedAdminKey || providedAdminKey !== configuredAdminKey) {
    apiLogger.warn('auth.admin_key_denied', {
      route: request.nextUrl.pathname,
      hasConfiguredKey: Boolean(configuredAdminKey),
      hasProvidedKey: Boolean(providedAdminKey),
    });

    return NextResponse.json(
      { error: 'Unauthorized. Missing or invalid admin credentials.' },
      { status: 401 }
    );
  }

  return null;
};

