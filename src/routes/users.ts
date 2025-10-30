/**
 * User Routes
 */

import type { BunRequest } from 'bun';
import { getDatabase } from '../database/index';
import { generateId } from '../utils/auth';
import {
  createErrorResponse,
  createSuccessResponse,
  handleAsync,
  ValidationError,
  NotFoundError,
} from '../utils/errors';
import { requireAuth, requireRole } from '../middleware/auth';
import type { User, UserProfile, AddAddressRequest } from '../types/index';
import { isValidPhone } from '../utils/validation';

/**
 * GET /api/v1/users/:id
 */
export async function getUser(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const userId = params.id;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const db = getDatabase();
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      throw new NotFoundError('User');
    }

    const userProfile: UserProfile = {
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

    return createSuccessResponse(userProfile);
  });
}

/**
 * PUT /api/v1/users/:id
 */
export async function updateUser(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'PUT') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Users can only update their own profile unless admin
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const body = (await request.json()) as Record<string, unknown>;

    const db = getDatabase();
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      throw new NotFoundError('User');
    }

    const updates: string[] = [];
    const values: (string | number | unknown)[] = [];

    if (body.first_name && typeof body.first_name === 'string') {
      updates.push('first_name = ?');
      values.push(body.first_name);
    }

    if (body.last_name && typeof body.last_name === 'string') {
      updates.push('last_name = ?');
      values.push(body.last_name);
    }

    if (body.phone && typeof body.phone === 'string') {
      if (!isValidPhone(body.phone)) {
        throw new ValidationError('Invalid phone number');
      }
      updates.push('phone = ?');
      values.push(body.phone);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(
      ...(values as any[])
    );

    const updatedUser = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User;

    const userProfile: UserProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
      email_verified: updatedUser.email_verified,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };

    return createSuccessResponse(userProfile);
  });
}

/**
 * DELETE /api/v1/users/:id
 */
export async function deleteUser(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Users can only delete their own account unless admin
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const db = getDatabase();
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      throw new NotFoundError('User');
    }

    // Soft delete - mark as inactive
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?').run(
      now,
      userId
    );

    return createSuccessResponse({ message: 'User account deleted successfully' });
  });
}

/**
 * GET /api/v1/users/:id/addresses
 */
export async function getUserAddresses(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Users can only view their own addresses unless admin
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const db = getDatabase();
    const addresses = db
      .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC')
      .all(userId);

    return createSuccessResponse(addresses);
  });
}

/**
 * POST /api/v1/users/:id/addresses
 */
export async function addUserAddress(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const body = (await request.json()) as AddAddressRequest;

    if (
      !body.street_address ||
      !body.city ||
      !body.state ||
      !body.postal_code ||
      !body.country
    ) {
      throw new ValidationError('All address fields are required');
    }

    const db = getDatabase();
    const addressId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO addresses (id, user_id, street_address, city, state, postal_code, country, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      addressId,
      userId,
      body.street_address,
      body.city,
      body.state,
      body.postal_code,
      body.country,
      body.is_default ? 1 : 0,
      now,
      now
    );

    // If this is the default address, unset others
    if (body.is_default) {
      db.prepare(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?'
      ).run(userId, addressId);
    }

    const address = db
      .prepare('SELECT * FROM addresses WHERE id = ?')
      .get(addressId);

    return createSuccessResponse(address, 201);
  });
}

/**
 * PUT /api/v1/users/:id/addresses/:addressId
 */
export async function updateUserAddress(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'PUT') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;
    const addressId = params.addressId;

    if (!userId || !addressId) {
      throw new ValidationError('User ID and address ID are required');
    }

    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const db = getDatabase();
    const address = db
      .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
      .get(addressId, userId);

    if (!address) {
      throw new NotFoundError('Address');
    }

    const body = (await request.json()) as Partial<AddAddressRequest>;
    const updates: string[] = [];
    const values: (string | number | unknown)[] = [];

    if (body.street_address) {
      updates.push('street_address = ?');
      values.push(body.street_address);
    }
    if (body.city) {
      updates.push('city = ?');
      values.push(body.city);
    }
    if (body.state) {
      updates.push('state = ?');
      values.push(body.state);
    }
    if (body.postal_code) {
      updates.push('postal_code = ?');
      values.push(body.postal_code);
    }
    if (body.country) {
      updates.push('country = ?');
      values.push(body.country);
    }
    if (body.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(body.is_default ? 1 : 0);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(addressId);

    db.prepare(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`).run(
      ...(values as any[])
    );

    // If set as default, unset others
    if (body.is_default) {
      db.prepare(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?'
      ).run(userId, addressId);
    }

    const updated = db
      .prepare('SELECT * FROM addresses WHERE id = ?')
      .get(addressId);

    return createSuccessResponse(updated);
  });
}

/**
 * DELETE /api/v1/users/:id/addresses/:addressId
 */
export async function deleteUserAddress(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);
    const userId = params.id;
    const addressId = params.addressId;

    if (!userId || !addressId) {
      throw new ValidationError('User ID and address ID are required');
    }

    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    const db = getDatabase();
    const address = db
      .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
      .get(addressId, userId);

    if (!address) {
      throw new NotFoundError('Address');
    }

    db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);

    return createSuccessResponse({ message: 'Address deleted successfully' });
  });
}

/**
 * GET /api/v1/users (Admin only)
 */
export async function listUsers(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const currentUser = await requireAuth(request);

    if (currentUser.role !== 'admin') {
      throw new ValidationError('Only admins can list users');
    }

    const db = getDatabase();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const users = db
      .prepare('SELECT * FROM users LIMIT ? OFFSET ?')
      .all(limit, offset);

    const countResult = db
      .prepare('SELECT COUNT(*) as total FROM users')
      .get() as { total: number };

    return createSuccessResponse({
      data: users,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  });
}
