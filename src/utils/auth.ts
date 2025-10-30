/**
 * Authentication and Security Utilities
 */

import type { JwtPayload, UserProfile } from '../types/index';

const JWT_SECRET = Bun.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = Bun.env.JWT_EXPIRY || '24h';
const HASH_ALGORITHM = 'argon2id';

/**
 * Hash password using Bun's password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await Bun.password.hash(password, {
      algorithm: HASH_ALGORITHM as 'argon2id' | 'bcrypt',
      memoryCost: 4,
      timeCost: 3,
    });
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Partial<JwtPayload>): string {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = parseExpiryTime(JWT_EXPIRY);

  const token = {
    iat: now,
    exp: now + expirySeconds,
    ...payload,
  };

  // Simple base64 JWT (in production, use a proper JWT library)
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const tokenPayload = JSON.stringify(token);

  const headerB64 = Buffer.from(header).toString('base64url');
  const payloadB64 = Buffer.from(tokenPayload).toString('base64url');

  const signature = generateSignature(`${headerB64}.${payloadB64}`, JWT_SECRET);

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    const expectedSignature = generateSignature(
      `${headerB64}.${payloadB64}`,
      JWT_SECRET
    );

    if (signatureB64 !== expectedSignature) {
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString();
    const payload = JSON.parse(payloadJson) as JwtPayload;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Generate HMAC signature
 */
function generateSignature(message: string, secret: string): string {
  const hasher = new Bun.CryptoHasher('sha256', secret);
  hasher.update(message);
  return hasher.digest('base64url');
}

/**
 * Parse expiry time string (e.g., "24h", "7d")
 */
function parseExpiryTime(timeStr: string): number {
  const match = timeStr.match(/(\d+)([hd])/);
  if (!match) return 86400; // Default to 24 hours

  const [, amount, unit] = match;
  const numAmount = parseInt(amount ?? '0', 10);

  if (unit === 'h') return numAmount * 3600;
  if (unit === 'd') return numAmount * 86400;

  return 86400;
}

/**
 * Generate UUID v7 (monotonic UUID)
 */
export function generateId(): string {
  return Bun.randomUUIDv7();
}

/**
 * Generate short code (for coupons, etc.)
 */
export function generateCode(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash data (non-cryptographic)
 */
export function hashData(data: string): number | bigint {
  return Bun.hash(data);
}

/**
 * Generate HMAC SHA256 for payment verification
 */
export function generateHMAC(data: string, secret: string): string {
  const hasher = new Bun.CryptoHasher('sha256', secret);
  hasher.update(data);
  return hasher.digest('hex');
}

/**
 * Generate secure verification token (64 characters)
 */
export function generateVerificationToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
