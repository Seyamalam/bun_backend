/**
 * Validation Utilities
 */

import { z } from 'zod';

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Password validation
 */
export function isValidPassword(password: string): boolean {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Phone number validation (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Postal code validation (US format)
 */
export function isValidPostalCode(postalCode: string): boolean {
  const usZipRegex = /^\d{5}(-\d{4})?$/;
  return usZipRegex.test(postalCode);
}

/**
 * Currency amount validation
 */
export function isValidCurrency(amount: number): boolean {
  return !isNaN(amount) && isFinite(amount) && amount >= 0;
}

/**
 * Pagination validation
 */
export function validatePagination(
  page: string | undefined,
  limit: string | undefined
): { page: number; limit: number } {
  let pageNum = 1;
  let limitNum = 20;

  if (page) {
    const parsedPage = parseInt(page, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNum = parsedPage;
    }
  }

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
      limitNum = parsedLimit;
    }
  }

  return { page: pageNum, limit: limitNum };
}

/**
 * SKU validation
 */
export function isValidSKU(sku: string): boolean {
  // Alphanumeric and hyphens, 3-50 characters
  const skuRegex = /^[A-Z0-9\-]{3,50}$/;
  return skuRegex.test(sku);
}

/**
 * Credit card validation (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, '');

  if (sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i] ?? '0', 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Rating validation (1-5 stars)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Discount percentage validation
 */
export function isValidDiscountPercentage(percentage: number): boolean {
  return isFinite(percentage) && percentage > 0 && percentage <= 100;
}

/**
 * Status validation for enums
 */
export function isValidStatus<T extends string>(
  status: string,
  validStatuses: T[]
): status is T {
  return validStatuses.includes(status as T);
}

/**
 * Quantity validation
 */
export function isValidQuantity(quantity: unknown): boolean {
  if (typeof quantity !== 'number') return false;
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 999999;
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string | undefined): string {
  if (!query) return '';
  const trimmed = query.trim().slice(0, 255);
  // Remove special characters except spaces and hyphens
  return trimmed.replace(/[^\w\s\-]/g, '');
}

/**
 * Validate sort field and direction
 */
export function validateSort(
  sortField: string | undefined,
  validFields: string[]
): { field: string; direction: 'ASC' | 'DESC' } {
  const field = validFields.includes(sortField || '')
    ? sortField!
    : validFields[0] || '';
  const direction = 'ASC' as const;

  return { field, direction };
}

/**
 * Deep validation using Zod schemas
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string[]> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
}

/**
 * Common Zod schemas for reuse
 */
export const schemas = {
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and numbers'
    ),
  phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/).optional(),
  quantity: z.number().int().min(1).max(999999),
  price: z.number().min(0),
  rating: z.number().int().min(1).max(5),
  discountPercentage: z.number().min(0.01).max(100),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  uuid: z.string().uuid(),
};
