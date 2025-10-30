/**
 * Authentication Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { getDatabase, DatabaseManager } from '../src/database/index';
import { generateId, generateToken, hashPassword, verifyPassword } from '../src/utils/auth';
import { isValidEmail, isValidPassword } from '../src/utils/validation';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken({
        user_id: 'test-user-123',
        email: 'test@example.com',
        role: 'customer',
      });

      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken({
        user_id: 'test-user-1',
        email: 'test1@example.com',
        role: 'customer',
      });

      const token2 = generateToken({
        user_id: 'test-user-2',
        email: 'test2@example.com',
        role: 'customer',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid UUIDs', () => {
      const id = generateId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    });
  });
});

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('StrongPass123')).toBe(true);
      expect(isValidPassword('AnotherStrong456')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('weak')).toBe(false); // Too short
      expect(isValidPassword('nouppercase123')).toBe(false); // No uppercase
      expect(isValidPassword('NOLOWERCASE123')).toBe(false); // No lowercase
      expect(isValidPassword('NoNumbers')).toBe(false); // No numbers
    });
  });
});

describe('Database', () => {
  let db: any;

  beforeAll(() => {
    db = getDatabase();
  });

  it('should have all required tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as any[];

    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('products');
    expect(tableNames).toContain('orders');
    expect(tableNames).toContain('carts');
    expect(tableNames).toContain('payments');
  });

  it('should support transactions', () => {
    const result = db.transaction(() => {
      return db.prepare('SELECT COUNT(*) as count FROM users').get();
    })();

    expect(result).toBeDefined();
    expect(result.count).toBeDefined();
  });
});
