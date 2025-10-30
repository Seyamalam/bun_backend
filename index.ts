/**
 * Main E-Commerce Backend Server
 * Built with Bun runtime and SQLite database
 */

import type { BunRequest } from 'bun';
import { getDatabase, closeDatabaseManager } from './src/database/index';

// Import routes
import * as authRoutes from './src/routes/auth';
import * as userRoutes from './src/routes/users';
import * as productRoutes from './src/routes/products';
import * as cartRoutes from './src/routes/cart';
import * as orderRoutes from './src/routes/orders';
import * as otherRoutes from './src/routes/other';
import * as healthRoutes from './src/routes/health';

// Import middleware & utilities
import { createErrorResponse, logRequest, getClientIp } from './src/utils/errors';
import { checkRateLimit, getRateLimitInfo } from './src/middleware/rateLimit';

const PORT = parseInt(Bun.env.PORT || '3000', 10);
const NODE_ENV = Bun.env.NODE_ENV || 'development';
const ENABLE_RATE_LIMIT = Bun.env.ENABLE_RATE_LIMIT !== 'false';

// Initialize database
const db = getDatabase();

/**
 * Extract route parameters from path
 */
function extractParams(
  path: string,
  pattern: string
): Record<string, string> | null {
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i] ?? '';
    const pathPart = pathParts[i] ?? '';
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathPart;
    } else if (part !== pathPart) {
      return null;
    }
  }

  return params;
}

/**
 * Main request handler
 */
async function handleRequest(
  request: BunRequest,
  server: any
): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const clientIp = getClientIp(request, server);

  console.log(`[${method}] ${path} from ${clientIp}`);

  // Apply rate limiting
  if (ENABLE_RATE_LIMIT && method !== 'GET') {
    if (!checkRateLimit(`${clientIp}-${path}`, 100, 60)) {
      logRequest(method, path, 429, Date.now() - startTime);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  try {
    let response: Response;

    // Route matching
    if (path === '/health') {
      response = await healthRoutes.healthCheck(request);
    } else if (path === '/api/v1/status') {
      response = await healthRoutes.apiStatus(request);
    }

    // Auth routes
    else if (path === '/api/v1/auth/register') {
      response = await authRoutes.register(request);
    } else if (path === '/api/v1/auth/login') {
      response = await authRoutes.login(request);
    } else if (path === '/api/v1/auth/logout') {
      response = await authRoutes.logout(request);
    } else if (path === '/api/v1/auth/refresh-token') {
      response = await authRoutes.refreshToken(request);
    } else if (path === '/api/v1/auth/verify-email') {
      response = await authRoutes.verifyEmail(request);
    } else if (path === '/api/v1/auth/forgot-password') {
      response = await authRoutes.forgotPassword(request);
    } else if (path === '/api/v1/auth/reset-password') {
      response = await authRoutes.resetPassword(request);
    } else if (path === '/api/v1/auth/me') {
      response = await authRoutes.getCurrentUser(request);
    }

    // User routes
    else if (path === '/api/v1/users') {
      response = await userRoutes.listUsers(request);
    } else if (extractParams(path, '/api/v1/users/:id')) {
      const p = extractParams(path, '/api/v1/users/:id')!;
      if (method === 'GET') {
        response = await userRoutes.getUser(request, p);
      } else if (method === 'PUT') {
        response = await userRoutes.updateUser(request, p);
      } else if (method === 'DELETE') {
        response = await userRoutes.deleteUser(request, p);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/users/:id/addresses')) {
      const p = extractParams(path, '/api/v1/users/:id/addresses')!;
      if (method === 'GET') {
        response = await userRoutes.getUserAddresses(request, p);
      } else if (method === 'POST') {
        response = await userRoutes.addUserAddress(request, p);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/users/:id/addresses/:addressId')) {
      const p = extractParams(path, '/api/v1/users/:id/addresses/:addressId')!;
      if (method === 'PUT') {
        response = await userRoutes.updateUserAddress(request, p);
      } else if (method === 'DELETE') {
        response = await userRoutes.deleteUserAddress(request, p);
      } else {
        return notFoundResponse();
      }
    }

    // Product routes
    else if (path === '/api/v1/products') {
      if (method === 'GET') {
        response = await productRoutes.listProducts(request);
      } else if (method === 'POST') {
        response = await productRoutes.createProduct(request);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/products/:id')) {
      const p = extractParams(path, '/api/v1/products/:id')!;
      if (method === 'GET') {
        response = await productRoutes.getProduct(request, p);
      } else if (method === 'PUT') {
        response = await productRoutes.updateProduct(request, p);
      } else if (method === 'DELETE') {
        response = await productRoutes.deleteProduct(request, p);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/products/:id/variants')) {
      const p = extractParams(path, '/api/v1/products/:id/variants')!;
      response = await productRoutes.getProductVariants(request, p);
    } else if (path === '/api/v1/categories') {
      if (method === 'GET') {
        response = await productRoutes.listCategories(request);
      } else if (method === 'POST') {
        response = await productRoutes.createCategory(request);
      } else {
        return notFoundResponse();
      }
    }

    // Cart routes
    else if (path === '/api/v1/cart') {
      if (method === 'GET') {
        response = await cartRoutes.getCart(request);
      } else if (method === 'DELETE') {
        response = await cartRoutes.clearCart(request);
      } else {
        return notFoundResponse();
      }
    } else if (path === '/api/v1/cart/items') {
      response = await cartRoutes.addToCart(request);
    } else if (extractParams(path, '/api/v1/cart/items/:itemId')) {
      const p = extractParams(path, '/api/v1/cart/items/:itemId')!;
      if (method === 'PUT') {
        response = await cartRoutes.updateCartItem(request, p);
      } else if (method === 'DELETE') {
        response = await cartRoutes.removeFromCart(request, p);
      } else {
        return notFoundResponse();
      }
    }

    // Order routes
    else if (path === '/api/v1/orders') {
      if (method === 'GET') {
        response = await orderRoutes.getUserOrders(request);
      } else if (method === 'POST') {
        response = await orderRoutes.createOrder(request);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/orders/:id')) {
      const p = extractParams(path, '/api/v1/orders/:id')!;
      if (method === 'GET') {
        response = await orderRoutes.getOrder(request, p);
      } else if (method === 'DELETE') {
        response = await orderRoutes.cancelOrder(request, p);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/orders/:id/status')) {
      const p = extractParams(path, '/api/v1/orders/:id/status')!;
      response = await orderRoutes.updateOrderStatus(request, p);
    }

    // Payment routes
    else if (path === '/api/v1/payments') {
      response = await otherRoutes.processPayment(request);
    } else if (extractParams(path, '/api/v1/payments/:id')) {
      const p = extractParams(path, '/api/v1/payments/:id')!;
      response = await otherRoutes.getPayment(request, p);
    }

    // Coupon routes
    else if (path === '/api/v1/coupons') {
      if (method === 'GET') {
        response = await otherRoutes.listCoupons(request);
      } else if (method === 'POST') {
        response = await otherRoutes.createCoupon(request);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/coupons/:code/validate')) {
      const p = extractParams(path, '/api/v1/coupons/:code/validate')!;
      response = await otherRoutes.validateCoupon(request, p);
    }

    // Inventory routes
    else if (path === '/api/v1/inventory') {
      response = await otherRoutes.getInventory(request);
    } else if (path === '/api/v1/inventory/low-stock') {
      response = await otherRoutes.getLowStockProducts(request);
    }

    // Review routes
    else if (extractParams(path, '/api/v1/products/:id/reviews')) {
      const p = extractParams(path, '/api/v1/products/:id/reviews')!;
      if (method === 'GET') {
        response = await otherRoutes.getProductReviews(request, p);
      } else if (method === 'POST') {
        response = await otherRoutes.submitReview(request, p);
      } else {
        return notFoundResponse();
      }
    } else if (extractParams(path, '/api/v1/reviews/:id')) {
      const p = extractParams(path, '/api/v1/reviews/:id')!;
      response = await otherRoutes.deleteReview(request, p);
    }

    // Catch-all: 404
    else {
      return notFoundResponse();
    }

    // Log request
    const statusCode = response.status;
    logRequest(method, path, statusCode, Date.now() - startTime);

    // Set security headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'");

    return newResponse;
  } catch (error) {
    console.error('Request error:', error);
    logRequest(method, path, 500, Date.now() - startTime);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      NODE_ENV === 'development'
    );
  }
}

/**
 * 404 Response
 */
function notFoundResponse(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Start Bun server
 */
const server = Bun.serve({
  port: PORT,
  fetch: async (request: BunRequest): Promise<Response> => handleRequest(request, server as any),
  error: (error: Error) => {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  },
}) as any;

console.log(`🚀 E-Commerce Backend Server running on http://localhost:${server.port}`);
console.log(`📝 Environment: ${NODE_ENV}`);
console.log(`🗄️ Database: Connected`);
console.log(`⏱️ Rate limiting: ${ENABLE_RATE_LIMIT ? 'Enabled' : 'Disabled'}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabaseManager();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabaseManager();
  process.exit(0);
});