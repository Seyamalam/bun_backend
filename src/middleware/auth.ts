/**
 * Authentication Middleware
 */

import type { BunRequest } from 'bun';
import { verifyToken } from '../utils/auth';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import type { UserProfile, UserRole, RequestContext } from '../types/index';
import { getDatabase } from '../database/index';

/**
 * Extract user from JWT token in request
 */
export async function extractUser(request: BunRequest): Promise<UserProfile | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Fetch user from database
  const db = getDatabase();
  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(payload.user_id) as any;

  if (!user || !user.is_active) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    role: user.role,
    is_active: user.is_active,
    email_verified: user.email_verified,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: BunRequest): Promise<UserProfile> {
  const user = await extractUser(request);

  if (!user) {
    throw new AuthenticationError('Invalid or missing authentication token');
  }

  return user;
}

/**
 * Require specific role middleware
 */
export async function requireRole(...roles: UserRole[]): Promise<(request: BunRequest) => Promise<UserProfile>> {
  return async (request: BunRequest) => {
    const user = await requireAuth(request);

    if (!roles.includes(user.role)) {
      throw new AuthorizationError(
        `This action requires one of the following roles: ${roles.join(', ')}`
      );
    }

    return user;
  };
}

/**
 * Optional auth middleware (sets user if available)
 */
export async function optionalAuth(request: BunRequest): Promise<UserProfile | null> {
  return extractUser(request);
}

/**
 * Attach request context
 */
export async function createRequestContext(
  request: BunRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  const user = await optionalAuth(request);
  const url = new URL(request.url);
  const query: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    user: user || undefined,
    params,
    query,
  };
}
