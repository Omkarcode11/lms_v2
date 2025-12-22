import { nanoid } from 'nanoid';

const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH);
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) {
    return false;
  }

  return token === cookieToken;
}

/**
 * Get CSRF token from headers or body
 */
export function getCsrfToken(headers: Headers, body?: Record<string, unknown>): string | null {
  // Check header first
  const headerToken = headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // Check body
  if (body && typeof body === 'object') {
    const token = body.csrfToken;
    return typeof token === 'string' ? token : null;
  }

  return null;
}

