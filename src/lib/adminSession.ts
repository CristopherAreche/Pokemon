import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE_NAME = 'pokemon_admin_session';

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

interface AdminSessionPayload {
  sub: 'admin';
  exp: number;
  iat: number;
}

const getAdminSessionSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_API_KEY?.trim();

  if (!secret) {
    throw new Error(
      'Missing required environment variable: ADMIN_SESSION_SECRET or ADMIN_API_KEY'
    );
  }

  return secret;
};

const signValue = (value: string) =>
  createHmac('sha256', getAdminSessionSecret()).update(value).digest('base64url');

const encodePayload = (payload: AdminSessionPayload) =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const decodePayload = (encodedPayload: string): AdminSessionPayload | null => {
  try {
    const decoded = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(decoded) as Partial<AdminSessionPayload>;

    if (payload.sub !== 'admin' || typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      return null;
    }

    return {
      sub: 'admin',
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
};

const getCookieConfig = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: ADMIN_SESSION_TTL_SECONDS,
});

export const createAdminSessionToken = () => {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: 'admin',
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
  };

  const encodedPayload = encodePayload(payload);
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

export const verifyAdminSessionToken = (token: string | undefined | null) => {
  if (!token) {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = signValue(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload) {
    return false;
  }

  return payload.exp > Math.floor(Date.now() / 1000);
};

export const hasValidAdminSession = (request: NextRequest) =>
  verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);

export const attachAdminSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: createAdminSessionToken(),
    ...getCookieConfig(),
  });
};

export const clearAdminSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    ...getCookieConfig(),
    maxAge: 0,
    expires: new Date(0),
  });
};
