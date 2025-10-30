/**
 * Product Routes
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
import type { CreateProductRequest } from '../types/index';
import { validatePagination, validateSearchQuery } from '../utils/validation';

/**
 * GET /api/v1/products
 */
export async function listProducts(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const url = new URL(request.url);
    const { page, limit } = validatePagination(
      url.searchParams.get('page') || undefined,
      url.searchParams.get('limit') || undefined
    );
    const search = validateSearchQuery(url.searchParams.get('search') || undefined);
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let query = 'SELECT * FROM products WHERE status = ?';
    const params: (string | number)[] = ['active'];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = db
      .prepare(`${query} LIMIT ? OFFSET ?`)
      .all(...(params as any[]), limit, offset);

    let countParams = ['active'];
    if (search) {
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const countQuery = 'SELECT COUNT(*) as total FROM products WHERE status = ?' + 
                       (search ? ' AND (name LIKE ? OR description LIKE ?)' : '');
    const countResult = db
      .prepare(countQuery)
      .get(...(countParams as any[])) as { total: number };

    return createSuccessResponse({
      data: products,
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
 * GET /api/v1/products/:id
 */
export async function getProduct(
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
    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Get variants
    const variants = db
      .prepare('SELECT * FROM product_variants WHERE product_id = ?')
      .all(productId);

    // Get attributes
    const attributes = db
      .prepare('SELECT * FROM product_attributes WHERE product_id = ?')
      .all(productId);

    return createSuccessResponse({
      ...product,
      variants,
      attributes,
    });
  });
}

/**
 * POST /api/v1/products
 */
export async function createProduct(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin' && user.role !== 'vendor') {
      throw new ValidationError('Unauthorized');
    }

    const body = (await request.json()) as CreateProductRequest;

    if (!body.name || !body.description || !body.price || !body.category_id || !body.sku) {
      throw new ValidationError('All required fields must be provided');
    }

    if (body.price < 0) {
      throw new ValidationError('Price must be non-negative');
    }

    const db = getDatabase();

    // Check category exists
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ?')
      .get(body.category_id);

    if (!category) {
      throw new NotFoundError('Category');
    }

    const productId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO products (id, name, description, price, category_id, vendor_id, status, stock_quantity, sku, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      productId,
      body.name,
      body.description,
      body.price,
      body.category_id,
      user.role === 'vendor' ? user.id : null,
      body.status || 'active',
      body.stock_quantity || 0,
      body.sku,
      now,
      now
    );

    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    return createSuccessResponse(product, 201);
  });
}

/**
 * PUT /api/v1/products/:id
 */
export async function updateProduct(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'PUT') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const productId = params.id;

    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    const db = getDatabase();
    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId) as any;

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Check authorization
    if (
      user.role !== 'admin' &&
      !(user.role === 'vendor' && product.vendor_id === user.id)
    ) {
      throw new ValidationError('Unauthorized');
    }

    const body = (await request.json()) as any;
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.price !== undefined && body.price >= 0) {
      updates.push('price = ?');
      values.push(body.price);
    }
    if (body.stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      values.push(body.stock_quantity);
    }
    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(productId);

    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(
      ...values
    );

    const updated = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    return createSuccessResponse(updated);
  });
}

/**
 * DELETE /api/v1/products/:id
 */
export async function deleteProduct(
  request: BunRequest,
  params: Record<string, string>
): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'DELETE') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);
    const productId = params.id;

    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can delete products');
    }

    const db = getDatabase();
    const product = db
      .prepare('SELECT id FROM products WHERE id = ?')
      .get(productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(productId);

    return createSuccessResponse({ message: 'Product deleted successfully' });
  });
}

/**
 * GET /api/v1/products/:id/variants
 */
export async function getProductVariants(
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
    const variants = db
      .prepare('SELECT * FROM product_variants WHERE product_id = ?')
      .all(productId);

    return createSuccessResponse(variants);
  });
}

/**
 * GET /api/v1/categories
 */
export async function listCategories(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'GET') {
      throw new ValidationError('Method not allowed');
    }

    const db = getDatabase();
    const categories = db
      .prepare('SELECT * FROM categories ORDER BY name')
      .all();

    return createSuccessResponse(categories);
  });
}

/**
 * POST /api/v1/categories
 */
export async function createCategory(request: BunRequest): Promise<Response> {
  return handleAsync(async () => {
    if (request.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      throw new ValidationError('Only admins can create categories');
    }

    const body = (await request.json()) as any;

    if (!body.name) {
      throw new ValidationError('Category name is required');
    }

    const db = getDatabase();
    const categoryId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO categories (id, name, description, parent_id, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      categoryId,
      body.name,
      body.description || null,
      body.parent_id || null,
      body.image_url || null,
      now,
      now
    );

    const category = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(categoryId);

    return createSuccessResponse(category, 201);
  });
}
