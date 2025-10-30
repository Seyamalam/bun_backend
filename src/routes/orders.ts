/**
 * Order Routes
 */

import type { BunRequest } from 'bun';
import { getDatabase } from '../database/index';
import { generateId } from '../utils/auth';
import {
  createSuccessResponse,
  handleAsync,
  ValidationError,
  NotFoundError,
} from '../utils/errors';
import { requireAuth } from '../middleware/auth';

/**
 * GET /api/v1/orders
 */
export async function getUserOrders(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const db = getDatabase();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const orders = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(user.id, limit, offset);

    const countResult = db
      .prepare('SELECT COUNT(*) as total FROM orders WHERE user_id = ?')
      .get(user.id) as { total: number };

    return createSuccessResponse({
      data: orders,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  });
}

/**
 * GET /api/v1/orders/:id
 */
export async function getOrder(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const orderId = params.id;

    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const db = getDatabase();
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
      .get(orderId, user.id);

    if (!order) {
      throw new NotFoundError('Order');
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(orderId);

    return createSuccessResponse({
      ...order,
      items,
    });
  });
}

/**
 * POST /api/v1/orders
 */
export async function createOrder(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const body = (await request.json()) as any;

    if (!body.shipping_address_id) {
      throw new ValidationError('Shipping address is required');
    }

    const db = getDatabase();

    // Verify address belongs to user
    const address = db
      .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
      .get(body.shipping_address_id, user.id);

    if (!address) {
      throw new NotFoundError('Address');
    }

    // Get cart
    const cart = db
      .prepare('SELECT * FROM carts WHERE user_id = ?')
      .get(user.id) as any;

    if (!cart) {
      throw new ValidationError('Cart not found');
    }

    // Get cart items
    const cartItems = db
      .prepare(
        `SELECT ci.*, p.price, pv.price_modifier
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         LEFT JOIN product_variants pv ON ci.variant_id = pv.id
         WHERE ci.cart_id = ?`
      )
      .all(cart.id) as any[];

    if (cartItems.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    // Calculate total
    let total = 0;
    cartItems.forEach((item) => {
      const price = item.price + (item.price_modifier || 0);
      total += price * item.quantity;
    });

    const orderId = generateId();
    const now = new Date().toISOString();

    // Create order
    db.prepare(
      `INSERT INTO orders (id, user_id, status, total_amount, shipping_address_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(orderId, user.id, 'pending', total, body.shipping_address_id, now, now);

    // Create order items
    cartItems.forEach((item) => {
      const itemId = generateId();
      const price = item.price + (item.price_modifier || 0);
      db.prepare(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        itemId,
        orderId,
        item.product_id,
        item.variant_id || null,
        item.quantity,
        price,
        price * item.quantity,
        now
      );

      // Update product stock
      db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    });

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

    const order = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(orderId);

    return createSuccessResponse(order, 201);
  });
}

/**
 * DELETE /api/v1/orders/:id
 */
export async function cancelOrder(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const orderId = params.id;

    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const db = getDatabase();
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
      .get(orderId, user.id) as any;

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (!['pending', 'processing'].includes(order.status)) {
      throw new ValidationError('Cannot cancel order with status: ' + order.status);
    }

    // Restore stock
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(orderId) as any[];

    const now = new Date().toISOString();

    items.forEach((item) => {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    });

    // Update order status
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run('cancelled', now, orderId);

    const updated = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(orderId);

    return createSuccessResponse(updated);
  });
}

/**
 * PUT /api/v1/orders/:id/status (Admin only)
 */
export async function updateOrderStatus(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'PUT') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can update order status');
    }

    const orderId = params.id;
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const body = (await request.json()) as any;

    if (!body.status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(body.status)) {
      throw new ValidationError('Invalid status');
    }

    const db = getDatabase();
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(orderId);

    if (!order) {
      throw new NotFoundError('Order');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(body.status, now, orderId);

    const updated = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(orderId);

    return createSuccessResponse(updated);
  });
}
