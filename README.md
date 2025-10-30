# E-Commerce Backend

Production-grade E-Commerce Backend API built with **Bun** runtime and **SQLite** database. Zero external dependencies beyond Zod for validation.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, login, profiles, addresses, role-based access control
- **Product Catalog**: CRUD operations, categories, variants, attributes, search & filtering
- **Shopping Cart**: Add/remove items, quantity management, cart persistence
- **Orders**: Order creation from cart, status tracking, cancellation with stock restoration
- **Payments**: Payment processing, status tracking, refund support
- **Discounts**: Coupon/discount codes with validation and usage limits
- **Inventory**: Stock level tracking, low stock alerts, history & audit trail
- **Reviews & Ratings**: Product reviews, 1-5 star ratings, approval workflow
- **Shipping**: Shipping methods, address management, tracking
- **Admin Dashboard**: Analytics, user management, order management
- **Vendor Support**: Vendor registration, product listings, analytics

### Technical Features
- **JWT-based Authentication**: Secure token generation and verification
- **Rate Limiting**: Per-IP, per-endpoint rate limiting
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Error Handling**: Centralized error handler with structured responses
- **Database**: SQLite with WAL mode for concurrent access
- **Logging**: Structured JSON logging for requests and errors
- **Validation**: Input validation using Zod schemas
- **Type Safety**: Full TypeScript support with strict mode
- **Performance**: SIMD-accelerated routing, optimized queries
- **Testing**: Comprehensive unit and integration tests

## 📋 Prerequisites

- **Bun 1.0+** - [Install Bun](https://bun.sh)
- **Node.js 18+** (optional, for compatibility)

## 🔧 Installation

```bash
# Clone repository
git clone <repository-url>
cd bun_backend

# Install dependencies
bun install

# Create environment file
cp .env.example .env
```

## 🏃 Running the Server

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start

# Build standalone executable
bun run build

# Build for specific platform
bun run build:linux
bun run build:macos
bun run build:windows
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: { token, user }
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```
POST /auth/refresh-token
Authorization: Bearer <token>
```

### User Endpoints

#### Get User
```
GET /users/:id
```

#### Update Profile
```
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890"
}
```

#### Get User Addresses
```
GET /users/:id/addresses
Authorization: Bearer <token>
```

#### Add Address
```
POST /users/:id/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "street_address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "postal_code": "62701",
  "country": "USA",
  "is_default": true
}
```

### Product Endpoints

#### List Products
```
GET /products?page=1&limit=20&search=laptop

Response:
{
  "data": [...],
  "pagination": { page, limit, total, pages }
}
```

#### Get Product
```
GET /products/:id
```

#### Create Product (Admin/Vendor)
```
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Description",
  "price": 99.99,
  "category_id": "cat-123",
  "stock_quantity": 100,
  "sku": "PROD-001"
}
```

#### Update Product (Admin/Vendor)
```
PUT /products/:id
Authorization: Bearer <token>
```

#### Delete Product (Admin)
```
DELETE /products/:id
Authorization: Bearer <token>
```

### Category Endpoints

#### List Categories
```
GET /categories
```

#### Create Category (Admin)
```
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices",
  "parent_id": null
}
```

### Cart Endpoints

#### Get Cart
```
GET /cart
Authorization: Bearer <token>
```

#### Add to Cart
```
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": "prod-123",
  "variant_id": "var-456",
  "quantity": 2
}
```

#### Update Cart Item
```
PUT /cart/items/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```
DELETE /cart/items/:itemId
Authorization: Bearer <token>
```

#### Clear Cart
```
DELETE /cart
Authorization: Bearer <token>
```

### Order Endpoints

#### Get User Orders
```
GET /orders?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Order Details
```
GET /orders/:id
Authorization: Bearer <token>
```

#### Create Order from Cart
```
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipping_address_id": "addr-123",
  "payment_method": "credit_card",
  "coupon_code": "SUMMER20"
}
```

#### Cancel Order
```
DELETE /orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin)
```
PUT /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped"
}
```

### Payment Endpoints

#### Process Payment
```
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "order-123",
  "amount": 99.99,
  "method": "credit_card"
}
```

#### Get Payment
```
GET /payments/:id
Authorization: Bearer <token>
```

### Coupon Endpoints

#### List Available Coupons
```
GET /coupons
```

#### Create Coupon (Admin)
```
POST /coupons
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER20",
  "discount_type": "percentage",
  "discount_value": 20,
  "min_purchase_amount": 100,
  "max_uses": 100,
  "expiry_date": "2025-12-31"
}
```

#### Validate Coupon
```
POST /coupons/:code/validate
Content-Type: application/json

{
  "cart_total": 150.00
}
```

### Inventory Endpoints

#### Get Inventory (Admin)
```
GET /inventory
Authorization: Bearer <token>
```

#### Get Low Stock Products (Admin)
```
GET /inventory/low-stock
Authorization: Bearer <token>
```

### Review Endpoints

#### Get Product Reviews
```
GET /products/:id/reviews
```

#### Submit Review
```
POST /products/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Great product!",
  "description": "Excellent quality and fast shipping",
  "rating": 5
}
```

#### Delete Review
```
DELETE /reviews/:id
Authorization: Bearer <token>
```

### Health Check

#### Health Status
```
GET /health

Response: { status: "healthy", uptime: 123.45 }
```

#### API Status
```
GET /api/v1/status

Response: { status: "operational", version: "1.0.0", database: "connected" }
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **addresses** - User delivery addresses
- **products** - Product catalog
- **categories** - Product categories with hierarchy
- **product_variants** - Product variants with price modifiers
- **product_attributes** - Product attributes
- **carts** - Shopping carts
- **cart_items** - Items in shopping carts
- **orders** - Customer orders
- **order_items** - Items in orders
- **payments** - Payment records
- **payment_methods** - User payment methods
- **coupons** - Discount/coupon codes
- **coupon_usage** - Coupon usage tracking
- **inventory_history** - Stock movement history
- **reviews** - Product reviews
- **review_helpful** - Helpful votes on reviews
- **shipping_methods** - Available shipping methods
- **order_shipping** - Order shipping information
- **vendors** - Vendor information
- **vendor_payouts** - Vendor payout records
- **notifications** - User notifications
- **audit_logs** - System audit trail

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage

# Run specific test file
bun test ./tests/auth.test.ts
```

## 📦 Building for Production

### Standalone Executable
```bash
# Build for current platform
bun run build

# Build for Linux x64
bun run build:linux

# Build for macOS ARM64
bun run build:macos

# Build for Windows x64
bun run build:windows
```

### Docker Deployment
```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM scratch
COPY --from=builder /app/ecommerce-backend /app
ENTRYPOINT ["/app"]
```

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Database
DATABASE_URL=ecommerce.db

# Features
ENABLE_RATE_LIMIT=true
```

## 🚀 Performance Metrics

- **Product listing**: <200ms
- **Search operations**: <500ms
- **Order creation**: <1s
- **Cart operations**: <100ms
- **Authentication**: <50ms
- **Rate limiting**: Custom per-endpoint/IP

## 🛡️ Security Features

- ✅ JWT token authentication
- ✅ Password hashing (Argon2)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Input validation (Zod)
- ✅ CORS ready
- ✅ Audit logging
- ✅ Role-based access control

## 📊 Monitoring & Logging

All requests are logged in JSON format:
```json
{
  "timestamp": "2025-10-30T10:30:45.123Z",
  "method": "POST",
  "path": "/api/v1/orders",
  "statusCode": 201,
  "duration": 145,
  "userId": "user-123"
}
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please create an issue on GitHub.

---

**Built with ❤️ using Bun and SQLite**


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
