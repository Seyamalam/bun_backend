/**
 * Health & Status Routes
 */

import type { BunRequest } from 'bun';
import { getDatabase } from '../database/index';
import { createSuccessResponse, handleAsync, ValidationError } from '../utils/errors';

/**
 * GET /health
 * Simple health check endpoint
 */
export async function healthCheck(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    return createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}

/**
 * GET /api/v1/status
 * Detailed API status
 */
export async function apiStatus(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const db = getDatabase();

    // Get basic stats
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)
      .count;
    const productCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any)
      .count;
    const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any)
      .count;

    return createSuccessResponse({
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        products: productCount,
        orders: orderCount,
      },
    });
  });
}
