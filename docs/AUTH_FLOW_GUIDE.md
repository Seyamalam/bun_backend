# Authentication Flow Guide

Complete guide for implementing authentication in your application.

## Overview

This e-commerce backend provides a complete authentication system with:
- User registration with email verification
- Secure login with JWT tokens
- Email verification with expiring tokens
- Password reset with secure tokens
- Token refresh mechanism

## Authentication Endpoints

### 1. User Registration

Register a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "019a340f-30f1-7000-9e41-32fb514344be",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "verification_token": "c620ebf456dfe02ea08e...",
    "message": "Registration successful. Please verify your email."
  }
}
```

**Notes:**
- Password must be at least 8 characters with uppercase, lowercase, and numbers
- Email must be valid format
- A verification token is generated (expires in 24 hours)
- User can login immediately but email should be verified

### 2. Email Verification

Verify user's email address with the token sent during registration.

**Endpoint:** `POST /api/v1/auth/verify-email`

**Request Body:**
```json
{
  "token": "c620ebf456dfe02ea08e..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

**Errors:**
- `401`: Invalid or expired verification token
- `401`: Verification token has expired (24 hours)
- `401`: Token already used

### 3. User Login

Authenticate with email and password.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "019a340f-30f1-7000-9e41-32fb514344be",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes:**
- Token expires in 24 hours
- Use token in Authorization header for protected endpoints: `Authorization: Bearer <token>`

### 4. Get Current User

Get information about the authenticated user.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "019a340f-30f1-7000-9e41-32fb514344be",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "email_verified": true,
    "is_active": true
  }
}
```

### 5. Refresh Token

Get a new JWT token before the current one expires.

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6. Forgot Password

Request a password reset token.

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a password reset link will be sent",
    "reset_token": "75d1c096ca918949c47c..."
  }
}
```

**Notes:**
- Always returns success (prevents user enumeration)
- Token expires in 1 hour
- Previous reset tokens are automatically invalidated
- In production, token should be sent via email, not in response

### 7. Reset Password

Reset password using the token from forgot-password.

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "75d1c096ca918949c47c...",
  "password": "NewSecurePass456",
  "password_confirm": "NewSecurePass456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Errors:**
- `401`: Invalid or expired password reset token
- `401`: Password reset token has expired (1 hour)
- `400`: Passwords do not match
- `400`: Password doesn't meet strength requirements

### 8. Logout

Logout user (client-side token disposal).

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Notes:**
- JWT tokens are stateless, so logout is primarily client-side
- Client should delete the stored token
- This endpoint can be used for audit logging

## Complete Authentication Flow Example

### Frontend Implementation (JavaScript)

```javascript
// 1. Register User
async function registerUser() {
  const response = await fetch('http://localhost:3000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123',
      password_confirm: 'SecurePass123',
      first_name: 'John',
      last_name: 'Doe'
    })
  });
  
  const data = await response.json();
  
  // Store token
  localStorage.setItem('authToken', data.data.token);
  
  // Store verification token (in production, send via email)
  const verificationToken = data.data.verification_token;
  
  return data;
}

// 2. Verify Email
async function verifyEmail(token) {
  const response = await fetch('http://localhost:3000/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  return await response.json();
}

// 3. Login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Store token
  localStorage.setItem('authToken', data.data.token);
  
  return data;
}

// 4. Make Authenticated Request
async function getProfile() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// 5. Request Password Reset
async function forgotPassword(email) {
  const response = await fetch('http://localhost:3000/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  return await response.json();
}

// 6. Reset Password
async function resetPassword(token, password, passwordConfirm) {
  const response = await fetch('http://localhost:3000/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password,
      password_confirm: passwordConfirm
    })
  });
  
  return await response.json();
}

// 7. Logout
async function logout() {
  const token = localStorage.getItem('authToken');
  
  await fetch('http://localhost:3000/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear token
  localStorage.removeItem('authToken');
}
```

## Security Best Practices

1. **Token Storage**
   - Store JWT tokens in httpOnly cookies (preferred) or localStorage
   - Never store tokens in plain text in database
   - Implement token refresh before expiry

2. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - Consider adding special characters requirement

3. **Rate Limiting**
   - Login attempts are rate-limited
   - Registration is rate-limited
   - Password reset requests are rate-limited

4. **Email Verification**
   - Tokens expire after 24 hours
   - One-time use only
   - In production, send via email service

5. **Password Reset**
   - Tokens expire after 1 hour
   - One-time use only
   - Old tokens invalidated on new request
   - Generic responses to prevent user enumeration

## Error Handling

All authentication endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-10-30T07:39:25.357Z"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (registration)
- `400`: Validation error
- `401`: Authentication error
- `403`: Authorization error (insufficient permissions)
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server error

## Testing

Run the complete authentication flow test:

```bash
bun run test-auth-flow.ts
```

This tests:
- Registration
- Email verification
- Password reset request
- Password reset
- Login with new password
- Token reuse prevention

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025
