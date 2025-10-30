# API Reference Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Endpoint Categories

## 1. HEALTH & STATUS

### GET /health
Health check endpoint (no authentication required)

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/v1/status
Detailed API status (no authentication required)

**Response:**
```json
{
  "status": "operational",
  "version": "1.0.0",
  "database": "connected",
  "stats": {
    "users": 150,
    "products": 500,
    "orders": 1250
  }
}
```

---

## 2. AUTHENTICATION

### POST /api/v1/auth/register
Register new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "password_confirm": "Password123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "token": "jwt_token"
  }
}
```

### POST /api/v1/auth/login
Login user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "token": "jwt_token",
    "expires_in": 86400
  }
}
```

### POST /api/v1/auth/logout
Logout user (requires authentication)

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### GET /api/v1/auth/me
Get current user (requires authentication)

**Response:**
```json
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

### POST /api/v1/auth/refresh-token
Refresh JWT token (requires authentication)

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "new_jwt_token",
    "expires_in": 86400
  }
}
```

### POST /api/v1/auth/verify-email
Verify email with code

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### POST /api/v1/auth/forgot-password
Request password reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/v1/auth/reset-password
Reset password with code

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "NewPassword123!",
  "password_confirm": "NewPassword123!"
}
```

---

## 3. USERS

### GET /api/v1/users/:id
Get user profile (requires authentication)

### PUT /api/v1/users/:id
Update user profile (requires authentication)

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890"
}
```

### DELETE /api/v1/users/:id
Delete user account (requires authentication)

### GET /api/v1/users
List all users (admin only)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)

### GET /api/v1/users/:id/addresses
Get user addresses (requires authentication)

### POST /api/v1/users/:id/addresses
Add new address (requires authentication)

**Request:**
```json
{
  "type": "home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "US",
  "is_default": true
}
```

### PUT /api/v1/users/:id/addresses/:addressId
Update address (requires authentication)

### DELETE /api/v1/users/:id/addresses/:addressId
Delete address (requires authentication)

---

## 4. PRODUCTS

### GET /api/v1/products
List products

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` (product name or description)
- `category` (category ID)
- `sort` (name, price, created_at)

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Laptop Pro",
        "price": 1299.99,
        "stock": 50,
        "rating": 4.5,
        "reviews_count": 120
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500
    }
  }
}
```

### GET /api/v1/products/:id
Get product details

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "price": 1299.99,
    "stock": 50,
    "sku": "LAPTOP-001",
    "category": {
      "id": "uuid",
      "name": "Electronics"
    },
    "attributes": {
      "color": "Silver",
      "storage": "512GB"
    }
  }
}
```

### POST /api/v1/products
Create product (admin/vendor only)

**Request:**
```json
{
  "name": "Laptop Pro",
  "description": "High-performance laptop",
  "sku": "LAPTOP-001",
  "price": 1299.99,
  "category_id": "uuid",
  "vendor_id": "uuid",
  "stock": 50,
  "attributes": {
    "color": "Silver",
    "storage": "512GB"
  }
}
```

### PUT /api/v1/products/:id
Update product (admin/vendor only)

### DELETE /api/v1/products/:id
Delete product (admin only)

### GET /api/v1/products/:id/variants
Get product variants

### GET /api/v1/categories
List categories

### POST /api/v1/categories
Create category (admin only)

**Request:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices"
}
```

---

## 5. CART

### GET /api/v1/cart
Get current user's cart (requires authentication)

**Response:**
```json
{
  "status": "success",
  "data": {
    "cart_id": "uuid",
    "items": [
      {
        "item_id": "uuid",
        "product_id": "uuid",
        "quantity": 2,
        "unit_price": 99.99,
        "total": 199.98
      }
    ],
    "subtotal": 199.98,
    "tax": 20.00,
    "total": 219.98
  }
}
```

### POST /api/v1/cart/items
Add item to cart (requires authentication)

**Request:**
```json
{
  "product_id": "uuid",
  "quantity": 2,
  "variant_id": "uuid"
}
```

### PUT /api/v1/cart/items/:itemId
Update cart item quantity (requires authentication)

**Request:**
```json
{
  "quantity": 3
}
```

### DELETE /api/v1/cart/items/:itemId
Remove item from cart (requires authentication)

### DELETE /api/v1/cart
Clear entire cart (requires authentication)

---

## 6. ORDERS

### GET /api/v1/orders
Get user's orders (requires authentication)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

### GET /api/v1/orders/:id
Get order details (requires authentication)

**Response:**
```json
{
  "status": "success",
  "data": {
    "order_id": "uuid",
    "status": "processing",
    "total_amount": 219.98,
    "items": [
      {
        "product_id": "uuid",
        "quantity": 2,
        "unit_price": 99.99
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/v1/orders
Create new order (requires authentication)

**Request:**
```json
{
  "shipping_address_id": "uuid",
  "billing_address_id": "uuid",
  "shipping_method_id": "uuid",
  "coupon_code": "DISCOUNT10",
  "payment_method": "credit_card"
}
```

### POST /api/v1/orders/:id/cancel
Cancel order (requires authentication)

**Conditions:**
- Order must be in "pending" or "processing" status
- Stock is restored

### PUT /api/v1/orders/:id/status
Update order status (admin only)

**Request:**
```json
{
  "status": "shipped"
}
```

**Valid statuses:** pending, processing, shipped, delivered, cancelled

---

## 7. PAYMENTS

### POST /api/v1/payments/process
Process payment (requires authentication)

**Request:**
```json
{
  "order_id": "uuid",
  "method": "credit_card",
  "amount": 219.98,
  "currency": "USD",
  "card_number": "4532015112830366",
  "card_exp_month": 12,
  "card_exp_year": 2025,
  "card_cvc": "123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "payment_id": "uuid",
    "order_id": "uuid",
    "amount": 219.98,
    "status": "completed"
  }
}
```

### GET /api/v1/payments/:id
Get payment details (requires authentication)

---

## 8. COUPONS

### GET /api/v1/coupons
List active coupons

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "code": "DISCOUNT10",
      "description": "10% off all items",
      "discount_percent": 10,
      "min_order_value": 50,
      "expires_at": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### POST /api/v1/coupons
Create coupon (admin only)

**Request:**
```json
{
  "code": "DISCOUNT10",
  "description": "10% off all items",
  "discount_percent": 10,
  "max_uses": 100,
  "min_order_value": 50,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### POST /api/v1/coupons/validate
Validate coupon

**Request:**
```json
{
  "code": "DISCOUNT10",
  "order_total": 150.00
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "discount_amount": 15.00,
    "final_total": 135.00
  }
}
```

---

## 9. INVENTORY

### GET /api/v1/inventory
Get inventory (admin only)

### GET /api/v1/inventory/low-stock
Get low stock products (admin only)

**Low stock threshold:** 10 units

---

## 10. REVIEWS

### GET /api/v1/products/:id/reviews
Get product reviews

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "rating": 5,
      "title": "Excellent product!",
      "comment": "Very satisfied",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/v1/reviews
Submit review (requires authentication)

**Request:**
```json
{
  "product_id": "uuid",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase"
}
```

**Rating:** 1-5

### DELETE /api/v1/reviews/:id
Delete review (requires authentication)

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Rate Limiting

Rate limits are applied per endpoint:
- **General endpoints:** 100 requests per 15 minutes
- **Authentication:** 5 login attempts per 15 minutes per IP
- **File uploads:** 10 per hour

If rate limit is exceeded, you'll receive a 429 response.

---

## Error Codes

| Code | Message |
|------|---------|
| INVALID_EMAIL | Email format is invalid |
| WEAK_PASSWORD | Password doesn't meet requirements |
| USER_EXISTS | User already exists |
| INVALID_CREDENTIALS | Email or password incorrect |
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Access denied |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Input validation failed |
| CONFLICT | Resource conflict |
| RATE_LIMITED | Too many requests |

---

## Quick Examples

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### List Products
```bash
curl http://localhost:3000/api/v1/products?page=1&limit=10
```

### Add to Cart
```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "product_id": "uuid",
    "quantity": 2
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "shipping_address_id": "uuid",
    "billing_address_id": "uuid",
    "payment_method": "credit_card"
  }'
```

---

For more information, see [README.md](./README.md) and [QUICKSTART.md](./QUICKSTART.md)
