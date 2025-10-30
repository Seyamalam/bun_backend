/**
 * Error Handling and Response Utilities
 */

import type { ApiResponse } from '../types/index';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Specific error types
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(500, 'INTERNAL_ERROR', message, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Create API response
 */
export function createResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  code?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    code,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: ApiError | Error,
  isDevelopment = false
): Response {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An error occurred';

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else {
    message = isDevelopment ? error.message : 'An error occurred';
  }

  const responseBody: ApiResponse<undefined> = createResponse(
    false,
    undefined,
    message,
    code
  );

  return Response.json(responseBody, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, statusCode = 200): Response {
  const responseBody = createResponse(true, data);
  return Response.json(responseBody, { status: statusCode });
}

/**
 * Handle async route errors
 */
export async function handleAsync(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error('Route error:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      Bun.env.NODE_ENV === 'development'
    );
  }
}

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T>(
  request: Request,
  schema?: (data: unknown) => { success: boolean; data?: T; errors?: unknown }
): Promise<T> {
  try {
    const text = await request.text();
    const data = JSON.parse(text);

    if (schema) {
      const result = schema(data);
      if (!result.success) {
        throw new ValidationError('Invalid request body', result.errors);
      }
      return result.data as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid JSON body');
  }
}

/**
 * Get client IP address
 */
export function getClientIp(request: Request, server?: any): string {
  // Check X-Forwarded-For header first (for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '0.0.0.0';
  }

  // Check X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Use server.requestIP if available
  if (server && server.requestIP) {
    const ip = server.requestIP(request);
    return ip?.address || '0.0.0.0';
  }

  return '0.0.0.0';
}

/**
 * Log error with context
 */
export function logError(
  error: Error | ApiError,
  context: Record<string, unknown> = {}
) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    ...(error instanceof ApiError && { statusCode: error.statusCode }),
    ...context,
  };

  console.error(JSON.stringify(errorInfo));
}

/**
 * Log request
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const timestamp = new Date().toISOString();
  const requestInfo = {
    timestamp,
    method,
    path,
    statusCode,
    duration,
    ...(userId && { userId }),
  };

  console.log(JSON.stringify(requestInfo));
}
