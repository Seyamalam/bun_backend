/**
 * Authentication Routes
 */

import type { BunRequest } from 'bun';
import { getDatabase } from '../database/index';
import {
  generateId,
  generateToken,
  hashPassword,
  verifyPassword,
} from '../utils/auth';
import {
  createErrorResponse,
  createSuccessResponse,
  handleAsync,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors';
import {
  isValidEmail,
  isValidPassword,
  validateWithSchema,
  schemas,
} from '../utils/validation';
import { requireAuth } from '../middleware/auth';
import type {
  User,
  AuthRequest,
  RegisterRequest,
  UserProfile,
} from '../types/index';
import { z } from 'zod';

/**
 * POST /api/v1/auth/register
 */
export async function register(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const body = (await request.json()) as RegisterRequest;

    // Validate required fields
    if (!body.email || !body.password || !body.password_confirm) {
      throw new ValidationError('Email, password, and password_confirm are required');
    }

    if (body.password !== body.password_confirm) {
      throw new ValidationError('Passwords do not match');
    }

    if (!isValidEmail(body.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!isValidPassword(body.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, and numbers'
      );
    }

    if (!body.first_name || !body.last_name) {
      throw new ValidationError('First name and last name are required');
    }

    const db = getDatabase();

    // Check if email already exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(body.email);

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);
    const userId = generateId();
    const now = new Date().toISOString();

    // Create user
    db.prepare(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      body.email,
      passwordHash,
      body.first_name,
      body.last_name,
      body.phone || null,
      'customer',
      true,
      false,
      now,
      now
    );

    // Create cart for user
    db.prepare('INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(generateId(), userId, now, now);

    // Generate token
    const token = generateToken({
      user_id: userId,
      email: body.email,
      role: 'customer',
    });

    const response = {
      user: {
        id: userId,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        role: 'customer',
      },
      token,
    };

    return createSuccessResponse(response, 201);
  });
}

/**
 * POST /api/v1/auth/login
 */
export async function login(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const body = (await request.json()) as AuthRequest;

    if (!body.email || !body.password) {
      throw new ValidationError('Email and password are required');
    }

    const db = getDatabase();

    // Find user
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(body.email) as User | undefined;

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const passwordValid = await verifyPassword(body.password, user.password_hash);

    if (!passwordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is disabled');
    }

    // Generate token
    const token = generateToken({
      user_id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      token,
    };

    return createSuccessResponse(response);
  });
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    // In JWT-based auth, logout is client-side (discard token)
    // This endpoint can be used for audit logging
    return createSuccessResponse({ message: 'Logged out successfully' });
  });
}

/**
 * POST /api/v1/auth/refresh-token
 */
export async function refreshToken(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    const newToken = generateToken({
      user_id: user.id,
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse({ token: newToken });
  });
}

/**
 * POST /api/v1/auth/verify-email
 */
export async function verifyEmail(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const body = (await request.json()) as { token?: string };

    if (!body.token) {
      throw new ValidationError('Verification token is required');
    }

    // TODO: Implement email verification with separate token
    // For now, we'll just mark email as verified
    const user = await requireAuth(request);
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').run(
      now,
      user.id
    );

    return createSuccessResponse({ message: 'Email verified successfully' });
  });
}

/**
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const body = (await request.json()) as { email: string };

    if (!body.email) {
      throw new ValidationError('Email is required');
    }

    if (!isValidEmail(body.email)) {
      throw new ValidationError('Invalid email format');
    }

    const db = getDatabase();

    // Check if user exists
    const user = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(body.email);

    if (!user) {
      // Return generic response for security
      return createSuccessResponse({
        message: 'If the email exists, a password reset link will be sent',
      });
    }

    // TODO: Send reset email with token
    return createSuccessResponse({
      message: 'If the email exists, a password reset link will be sent',
    });
  });
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const body = (await request.json()) as {
      token?: string;
      password?: string;
      password_confirm?: string;
    };

    if (!body.token || !body.password || !body.password_confirm) {
      throw new ValidationError('Token and password fields are required');
    }

    if (body.password !== body.password_confirm) {
      throw new ValidationError('Passwords do not match');
    }

    if (!isValidPassword(body.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, and numbers'
      );
    }

    // TODO: Verify reset token before updating password
    // For now, return error
    throw new AuthenticationError('Password reset token is invalid or expired');
  });
}

/**
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    return createSuccessResponse(user);
  });
}
