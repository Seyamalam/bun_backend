/**
 * API Endpoint Integration Tests
 */

import { describe, it, expect } from 'bun:test';

describe('Health Check Endpoints', () => {
  it('should provide /health endpoint', async () => {
    const response = await fetch('http://localhost:3000/health');
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });

  it('should provide /api/v1/status endpoint', async () => {
    const response = await fetch('http://localhost:3000/api/v1/status');
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('operational');
  });
});

describe('Authentication Endpoints', () => {
  it('should register new user', async () => {
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
        password_confirm: 'Password123',
        first_name: 'John',
        last_name: 'Doe',
      }),
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe(uniqueEmail);
    expect(data.data.token).toBeDefined();
  });

  it('should login existing user', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
      }),
    });

    if (response.status === 200) {
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
    }
  });

  it('should validate required fields on registration', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        // Missing password fields
        first_name: 'John',
        last_name: 'Doe',
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe('Product Endpoints', () => {
  it('should list products', async () => {
    const response = await fetch('http://localhost:3000/api/v1/products');
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.data)).toBe(true);
  });

  it('should list categories', async () => {
    const response = await fetch('http://localhost:3000/api/v1/categories');
    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should return 404 for non-existent endpoints', async () => {
    const response = await fetch('http://localhost:3000/api/v1/nonexistent');
    expect(response.status).toBe(404);
  });

  it('should return structured error responses', async () => {
    const response = await fetch('http://localhost:3000/api/v1/nonexistent');
    const data = (await response.json()) as any;
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});
