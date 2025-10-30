/**
 * Cart Routes
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
import { isValidQuantity } from '../utils/validation';

/**
 * GET /api/v1/cart
 */
export async function getCart(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const db = getDatabase();

    // Get or create cart
    let cart = db
      .prepare('SELECT * FROM carts WHERE user_id = ?')
      .get(user.id) as any;

    if (!cart) {
      const cartId = generateId();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(cartId, user.id, now, now);
      cart = db
        .prepare('SELECT * FROM carts WHERE id = ?')
        .get(cartId);
    }

    // Get cart items
    const items = db
      .prepare(`
        SELECT ci.*, p.name, p.price, pv.price_modifier
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id
        WHERE ci.cart_id = ?
      `)
      .all(cart.id);

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      const price = item.price + (item.price_modifier || 0);
      subtotal += price * item.quantity;
    });

    return createSuccessResponse({
      cart,
      items,
      totals: {
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
      },
    });
  });
}

/**
 * POST /api/v1/cart/items
 */
export async function addToCart(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const body = (await request.json()) as any;

    if (!body.product_id || !isValidQuantity(body.quantity)) {
      throw new ValidationError('Product ID and valid quantity are required');
    }

    const db = getDatabase();

    // Get or create cart
    let cart = db
      .prepare('SELECT * FROM carts WHERE user_id = ?')
      .get(user.id) as any;

    if (!cart) {
      const cartId = generateId();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(cartId, user.id, now, now);
      cart = db
        .prepare('SELECT * FROM carts WHERE id = ?')
        .get(cartId);
    }

    // Check product exists
    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(body.product_id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Check for existing cart item
    const existingItem = db
      .prepare(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id IS ?'
      )
      .get(cart.id, body.product_id, body.variant_id || null);

    const now = new Date().toISOString();

    if (existingItem) {
      // Update quantity
      db.prepare('UPDATE cart_items SET quantity = quantity + ?, updated_at = ? WHERE id = ?')
        .run(body.quantity, now, (existingItem as any).id);
    } else {
      // Add new item
      const itemId = generateId();
      db.prepare(
        `INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        itemId,
        cart.id,
        body.product_id,
        body.variant_id || null,
        body.quantity,
        now,
        now
      );
    }

    // Update cart timestamp
    db.prepare('UPDATE carts SET updated_at = ? WHERE id = ?').run(now, cart.id);

    return createSuccessResponse({ message: 'Item added to cart' }, 201);
  });
}

/**
 * PUT /api/v1/cart/items/:itemId
 */
export async function updateCartItem(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'PUT') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const itemId = params.itemId;

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    const body = (await request.json()) as any;

    if (!isValidQuantity(body.quantity)) {
      throw new ValidationError('Valid quantity is required');
    }

    const db = getDatabase();

    // Verify ownership
    const item = db
      .prepare(
        `SELECT ci.* FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.id
         WHERE ci.id = ? AND c.user_id = ?`
      )
      .get(itemId, user.id);

    if (!item) {
      throw new NotFoundError('Cart item');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?')
      .run(body.quantity, now, itemId);

    return createSuccessResponse({ message: 'Cart item updated' });
  });
}

/**
 * DELETE /api/v1/cart/items/:itemId
 */
export async function removeFromCart(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const itemId = params.itemId;

    if (!itemId) {
      throw new ValidationError('Item ID is required');
    }

    const db = getDatabase();

    // Verify ownership
    const item = db
      .prepare(
        `SELECT ci.* FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.id
         WHERE ci.id = ? AND c.user_id = ?`
      )
      .get(itemId, user.id);

    if (!item) {
      throw new NotFoundError('Cart item');
    }

    db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);

    return createSuccessResponse({ message: 'Item removed from cart' });
  });
}

/**
 * DELETE /api/v1/cart
 */
export async function clearCart(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const db = getDatabase();

    const cart = db
      .prepare('SELECT * FROM carts WHERE user_id = ?')
      .get(user.id) as any;

    if (!cart) {
      throw new NotFoundError('Cart');
    }

    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

    return createSuccessResponse({ message: 'Cart cleared' });
  });
}
