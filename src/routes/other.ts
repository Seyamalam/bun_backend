/**
 * Payment Routes, Coupon Routes, Inventory Routes, Reviews Routes
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

// ==================== PAYMENT ROUTES ====================

/**
 * POST /api/v1/payments
 */
export async function processPayment(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const body = (await request.json()) as any;

    if (!body.order_id || !body.amount || !body.method) {
      throw new ValidationError('Order ID, amount, and method are required');
    }

    const db = getDatabase();
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
      .get(body.order_id, user.id);

    if (!order) {
      throw new NotFoundError('Order');
    }

    const paymentId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO payments (id, order_id, user_id, amount, status, method, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(paymentId, body.order_id, user.id, body.amount, 'completed', body.method, now, now);

    // Update order status
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run('processing', now, body.order_id);

    const payment = db
      .prepare('SELECT * FROM payments WHERE id = ?')
      .get(paymentId);

    return createSuccessResponse(payment, 201);
  });
}

/**
 * GET /api/v1/payments/:id
 */
export async function getPayment(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const paymentId = params.id;

    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    const db = getDatabase();
    const payment = db
      .prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?')
      .get(paymentId, user.id);

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    return createSuccessResponse(payment);
  });
}

// ==================== COUPON ROUTES ====================

/**
 * GET /api/v1/coupons
 */
export async function listCoupons(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const db = getDatabase();
    const coupons = db
      .prepare('SELECT * FROM coupons WHERE is_active = 1 AND datetime(expiry_date) > datetime(now)')
      .all();

    return createSuccessResponse(coupons);
  });
}

/**
 * POST /api/v1/coupons
 */
export async function createCoupon(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can create coupons');
    }

    const body = (await request.json()) as any;

    if (
      !body.code ||
      !body.discount_type ||
      !body.discount_value ||
      !body.expiry_date
    ) {
      throw new ValidationError('All required fields must be provided');
    }

    const db = getDatabase();
    const couponId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase_amount, max_uses, uses_count, expiry_date, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      couponId,
      body.code.toUpperCase(),
      body.discount_type,
      body.discount_value,
      body.min_purchase_amount || 0,
      body.max_uses || -1,
      0,
      body.expiry_date,
      true,
      now,
      now
    );

    const coupon = db
      .prepare('SELECT * FROM coupons WHERE id = ?')
      .get(couponId);

    return createSuccessResponse(coupon, 201);
  });
}

/**
 * POST /api/v1/coupons/:code/validate
 */
export async function validateCoupon(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const code = params.code;
    if (!code) {
      throw new ValidationError('Coupon code is required');
    }

    const body = (await request.json()) as any;
    const cartTotal = body.cart_total || 0;

    const db = getDatabase();
    const coupon = db
      .prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1')
      .get(code.toUpperCase()) as any;

    if (!coupon) {
      throw new NotFoundError('Coupon');
    }

    // Check expiry
    if (new Date(coupon.expiry_date) < new Date()) {
      throw new ValidationError('Coupon has expired');
    }

    // Check uses
    if (coupon.max_uses !== -1 && coupon.uses_count >= coupon.max_uses) {
      throw new ValidationError('Coupon usage limit reached');
    }

    // Check minimum purchase
    if (cartTotal < coupon.min_purchase_amount) {
      throw new ValidationError(
        `Minimum purchase amount is ${coupon.min_purchase_amount}`
      );
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    return createSuccessResponse({
      coupon,
      discount_amount: discountAmount,
    });
  });
}

// ==================== INVENTORY ROUTES ====================

/**
 * GET /api/v1/inventory
 */
export async function getInventory(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can view inventory');
    }

    const db = getDatabase();
    const inventory = db
      .prepare('SELECT id, sku, name, stock_quantity FROM products ORDER BY name')
      .all();

    return createSuccessResponse(inventory);
  });
}

/**
 * GET /api/v1/inventory/low-stock
 */
export async function getLowStockProducts(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can view inventory');
    }

    const db = getDatabase();
    const threshold = 10; // Low stock threshold
    const products = db
      .prepare('SELECT * FROM products WHERE stock_quantity < ? ORDER BY stock_quantity')
      .all(threshold);

    return createSuccessResponse(products);
  });
}

// ==================== REVIEW ROUTES ====================

/**
 * GET /api/v1/products/:id/reviews
 */
export async function getProductReviews(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const productId = params.id;
    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    const db = getDatabase();
    const reviews = db
      .prepare('SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC')
      .all(productId);

    return createSuccessResponse(reviews);
  });
}

/**
 * POST /api/v1/products/:id/reviews
 */
export async function submitReview(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const productId = params.id;

    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    const body = (await request.json()) as any;

    if (!body.title || !body.description || !body.rating) {
      throw new ValidationError('Title, description, and rating are required');
    }

    if (body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }

    const db = getDatabase();

    // Check product exists
    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    const reviewId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO reviews (id, product_id, user_id, title, description, rating, is_approved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      reviewId,
      productId,
      user.id,
      body.title,
      body.description,
      body.rating,
      false,
      now,
      now
    );

    const review = db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(reviewId);

    return createSuccessResponse(review, 201);
  });
}

/**
 * DELETE /api/v1/reviews/:id
 */
export async function deleteReview(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const reviewId = params.id;

    if (!reviewId) {
      throw new ValidationError('Review ID is required');
    }

    const db = getDatabase();
    const review = db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(reviewId) as any;

    if (!review) {
      throw new NotFoundError('Review');
    }

    if (user.id !== review.user_id && user.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);

    return createSuccessResponse({ message: 'Review deleted successfully' });
  });
}
