# Bun E-Commerce Backend - Production Plan

**Project**: E-Commerce Backend Service  
**Stack**: Bun (runtime), Bun SQLite (database)  
**Status**: Production Ready  
**Date**: October 30, 2025

---

## Executive Summary

This document outlines the complete feature set and API endpoints for a production-grade e-commerce backend built entirely with Bun and Bun SQLite. No external dependencies will be used except where absolutely necessary for core functionality.

---

## Architecture Overview

### Core Components
- **HTTP Server**: Bun's native HTTP server with `Bun.serve()` routes
- **Database**: Bun SQLite for persistent storage
- **Authentication**: JWT-based token authentication with cookies
- **Request Validation**: Custom validation middleware
- **Error Handling**: Centralized error handler with development mode
- **Logging**: Structured logging system
- **TLS/HTTPS**: Production-grade encryption support
- **Metrics**: Built-in server metrics monitoring (pending requests, connections)

---

## Feature List

### 1. User Management
- User registration with email validation
- User login with JWT token generation
- Password hashing and verification
- User profile management (view/update)
- User account deletion
- Password reset functionality
- Email verification system
- Role-based access control (Admin, Customer, Vendor)
- User session management

### 2. Product Management
- Product CRUD operations
- Product categorization and subcategories
- Product inventory tracking
- Product pricing management
- Product descriptions and specifications
- Product images/media handling
- Stock level management
- Product search and filtering
- Product sorting (by price, rating, popularity, date)
- Bulk product operations
- Product status (active, inactive, archived)
- Product variants support

### 3. Inventory Management
- Stock level tracking per product
- Stock reservation for pending orders
- Inventory adjustment logs
- Low stock alerts
- Reorder point configuration
- Inventory history and audit trail
- Batch inventory updates

### 4. Shopping Cart
- Add items to cart
- Remove items from cart
- Update item quantities
- View cart contents
- Calculate cart totals
- Apply discount codes
- Cart persistence
- Cart expiration handling
- Bulk cart operations

### 5. Order Management
- Create orders from cart
- Order status tracking (pending, processing, shipped, delivered, cancelled, returned)
- Order history retrieval
- Order cancellation
- Order details retrieval
- Order tracking
- Multiple order states and transitions
- Order creation timestamp and updates
- Customer order history
- Admin order management

### 6. Payment Processing
- Payment method storage
- Payment status tracking (pending, completed, failed, refunded)
- Payment history
- Refund processing
- Payment verification
- Transaction logging
- Payment failures handling
- Multiple payment methods support

### 7. Discounts & Promotions
- Discount code creation and management
- Discount application to cart/orders
- Discount validation (expiration, usage limits, minimum purchase)
- Discount types (percentage, fixed amount)
- Usage tracking per discount code
- Per-user discount limits
- Bulk discount creation

### 8. Categories & Attributes
- Product category management
- Category hierarchy
- Category descriptions
- Category images
- Product attributes management
- Attribute values and options
- Attribute-product associations

### 9. Customer Reviews & Ratings
- Submit product reviews
- Rate products (1-5 stars)
- Review approval workflow
- Review visibility management
- Average product rating calculation
- Review moderation
- Review deletion
- Helpful votes on reviews

### 10. Shipping Management
- Shipping address management
- Shipping method selection
- Shipping rate calculation
- Delivery time estimation
- Shipping status tracking
- Multiple address support per customer
- Address validation

### 11. Admin Dashboard & Analytics
- Sales metrics
- Revenue reports
- Customer metrics
- Product performance analysis
- Order analytics
- Inventory analytics
- Dashboard data aggregation

### 12. Vendor Management (B2B)
- Vendor registration and verification
- Vendor profile management
- Vendor product listings
- Vendor commission tracking
- Vendor payout management
- Vendor performance metrics

### 13. Notification System
- Order confirmation notifications
- Shipment updates
- Delivery notifications
- Review reminders
- Account notifications
- Email notification queuing

### 14. Security & Compliance
- SQL injection prevention
- CORS configuration
- Rate limiting per endpoint
- Request validation
- Authentication token expiration
- Password security policies
- Data encryption for sensitive fields
- Audit logging

### 15. Data Management
- Data backup procedures
- Data consistency checks
- Transaction support
- Database integrity
- Soft deletes for logical deletion

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/refresh-token` | Refresh JWT token |
| POST | `/api/v1/auth/verify-email` | Verify email address |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/me` | Get current user profile |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/:id` | Get user details |
| PUT | `/api/v1/users/:id` | Update user profile |
| DELETE | `/api/v1/users/:id` | Delete user account |
| GET | `/api/v1/users/:id/addresses` | Get user addresses |
| POST | `/api/v1/users/:id/addresses` | Add new address |
| PUT | `/api/v1/users/:id/addresses/:addressId` | Update address |
| DELETE | `/api/v1/users/:id/addresses/:addressId` | Delete address |
| GET | `/api/v1/users` | List all users (Admin only) |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List all products |
| GET | `/api/v1/products/:id` | Get product details |
| POST | `/api/v1/products` | Create product (Admin/Vendor) |
| PUT | `/api/v1/products/:id` | Update product (Admin/Vendor) |
| DELETE | `/api/v1/products/:id` | Delete product (Admin) |
| GET | `/api/v1/products/:id/variants` | Get product variants |
| POST | `/api/v1/products/:id/variants` | Add product variant |
| GET | `/api/v1/products/search` | Search products |
| GET | `/api/v1/products/category/:categoryId` | Get products by category |

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List all categories |
| GET | `/api/v1/categories/:id` | Get category details |
| POST | `/api/v1/categories` | Create category (Admin) |
| PUT | `/api/v1/categories/:id` | Update category (Admin) |
| DELETE | `/api/v1/categories/:id` | Delete category (Admin) |
| GET | `/api/v1/categories/:id/products` | Get products in category |

### Cart Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cart` | Get current cart |
| POST | `/api/v1/cart/items` | Add item to cart |
| PUT | `/api/v1/cart/items/:itemId` | Update cart item quantity |
| DELETE | `/api/v1/cart/items/:itemId` | Remove item from cart |
| DELETE | `/api/v1/cart` | Clear cart |
| POST | `/api/v1/cart/apply-coupon` | Apply discount code |
| DELETE | `/api/v1/cart/remove-coupon` | Remove discount code |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | Get user orders |
| GET | `/api/v1/orders/:id` | Get order details |
| POST | `/api/v1/orders` | Create order from cart |
| PUT | `/api/v1/orders/:id` | Update order |
| DELETE | `/api/v1/orders/:id` | Cancel order |
| PUT | `/api/v1/orders/:id/status` | Update order status (Admin) |
| GET | `/api/v1/orders/:id/tracking` | Get order tracking info |
| POST | `/api/v1/orders/:id/refund` | Process refund |
| GET | `/api/v1/admin/orders` | List all orders (Admin) |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments` | Process payment |
| GET | `/api/v1/payments/:id` | Get payment details |
| POST | `/api/v1/payments/:id/refund` | Refund payment |
| GET | `/api/v1/payments` | Get user payments |
| POST | `/api/v1/payments/methods` | Add payment method |
| GET | `/api/v1/payments/methods` | Get user payment methods |
| DELETE | `/api/v1/payments/methods/:methodId` | Delete payment method |

### Discount & Coupon Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/coupons` | List available coupons |
| GET | `/api/v1/coupons/:code` | Get coupon details |
| POST | `/api/v1/coupons` | Create coupon (Admin) |
| PUT | `/api/v1/coupons/:code` | Update coupon (Admin) |
| DELETE | `/api/v1/coupons/:code` | Delete coupon (Admin) |
| POST | `/api/v1/coupons/:code/validate` | Validate coupon |

### Inventory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory` | Get inventory levels (Admin) |
| PUT | `/api/v1/inventory/:productId` | Update inventory level |
| GET | `/api/v1/inventory/low-stock` | Get low stock products |
| POST | `/api/v1/inventory/adjust` | Adjust inventory |
| GET | `/api/v1/inventory/history` | Get inventory history |

### Review & Rating Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products/:id/reviews` | Get product reviews |
| POST | `/api/v1/products/:id/reviews` | Submit review |
| PUT | `/api/v1/reviews/:id` | Update review |
| DELETE | `/api/v1/reviews/:id` | Delete review |
| POST | `/api/v1/reviews/:id/approve` | Approve review (Admin) |
| POST | `/api/v1/reviews/:id/helpful` | Mark review as helpful |

### Shipping Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shipping/methods` | Get shipping methods |
| POST | `/api/v1/shipping/calculate` | Calculate shipping cost |
| GET | `/api/v1/orders/:id/shipping` | Get order shipping info |
| PUT | `/api/v1/orders/:id/shipping` | Update shipping address |

### Vendor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vendors/register` | Vendor registration |
| GET | `/api/v1/vendors/:id` | Get vendor profile |
| PUT | `/api/v1/vendors/:id` | Update vendor profile |
| GET | `/api/v1/vendors/:id/products` | Get vendor products |
| GET | `/api/v1/vendors/:id/analytics` | Get vendor analytics |
| GET | `/api/v1/vendors/:id/payouts` | Get vendor payouts |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Dashboard metrics |
| GET | `/api/v1/admin/analytics/sales` | Sales analytics |
| GET | `/api/v1/admin/analytics/customers` | Customer analytics |
| GET | `/api/v1/admin/analytics/products` | Product analytics |
| GET | `/api/v1/admin/users` | List all users |
| PUT | `/api/v1/admin/users/:id/role` | Update user role |
| DELETE | `/api/v1/admin/users/:id` | Delete user |
| GET | `/api/v1/admin/reports` | Generate reports |
| GET | `/api/v1/admin/audit-logs` | View audit logs |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Get user notifications |
| POST | `/api/v1/notifications/:id/read` | Mark notification as read |
| DELETE | `/api/v1/notifications/:id` | Delete notification |
| GET | `/api/v1/notifications/preferences` | Get notification preferences |
| PUT | `/api/v1/notifications/preferences` | Update notification preferences |

### Health & Status Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/status` | API status |

---

## Database Schema Overview

### Core Tables
- **users** - User account information
- **user_roles** - User role assignments
- **addresses** - User delivery addresses
- **products** - Product catalog
- **categories** - Product categories
- **product_variants** - Product variants
- **product_attributes** - Product attributes
- **inventory** - Stock levels
- **carts** - Shopping cart data
- **cart_items** - Individual cart items
- **orders** - Customer orders
- **order_items** - Items in orders
- **payments** - Payment records
- **payment_methods** - User payment methods
- **coupons** - Discount codes
- **reviews** - Product reviews
- **ratings** - Product ratings
- **shipping_addresses** - Shipping address records
- **vendors** - Vendor information
- **vendor_products** - Vendor product mappings
- **notifications** - User notifications
- **audit_logs** - System audit trail
- **inventory_history** - Inventory change logs

---

## Security Requirements

- JWT token authentication for all protected endpoints
- Password hashing with industry-standard algorithms
- SQL injection prevention through parameterized queries
- **Cookie-based session management** with httpOnly and secure flags
- CORS protection for cross-origin requests
- Rate limiting to prevent abuse
- Input validation on all endpoints
- Sensitive data encryption
- **TLS/HTTPS enforcement in production** with certificate management
- Request logging and monitoring
- Audit trail for critical operations

---

## Performance Requirements

- Product listing response time: < 200ms
- Search operations: < 500ms
- Order processing: < 1s
- Cart operations: < 100ms
- Database connection pooling and query optimization
- **SIMD-accelerated route parameter decoding** for optimal routing performance
- Efficient cookie parsing and validation
- Caching strategy for frequently accessed data
- Pagination for large result sets
- **Static response optimization** for health checks and fixed configs

---

## Error Handling

- Standardized error response format
- Meaningful error messages
- HTTP status code compliance
- Error logging and monitoring
- Graceful degradation
- Request validation errors with detailed feedback

---

## Deployment Considerations

- Environment configuration management
- Database migration strategy
- Zero-downtime deployment capability
- Monitoring and alerting
- Backup and recovery procedures
- Scalability for high traffic
- Load balancing ready

---

## Technical Implementation Stack

### Bun Modules & Functions Reference

#### Core Server
- `Bun.serve()` - Main HTTP server initialization with routes
- `Bun.serve().routes` - Route definitions object (static, dynamic, wildcard)
- `Bun.serve().fetch` - Fallback handler for unmatched routes
- `Bun.serve().error` - Global error handler
- `server.port` - Get assigned port number
- `server.url` - Get full server URL
- `server.stop()` - Graceful server shutdown
- `server.requestIP(request)` - Get client IP and port

#### Request/Response
- `BunRequest` - Extended Request object with `params` and `cookies`
- `request.params` - Type-safe route parameters
- `request.cookies` - CookieMap for reading/writing cookies
- `Response.json()` - Create JSON response
- `new Response()` - Create custom responses
- `Response.redirect()` - Create redirect responses

#### Cookies (Bun.Cookie & Bun.CookieMap)
- `new Bun.Cookie(name, value, options)` - Create cookie instance
- `Bun.Cookie.parse(string)` - Parse cookie from string
- `cookie.serialize()` / `cookie.toString()` - Serialize to Set-Cookie header
- `cookie.isExpired()` - Check expiration status
- `new Bun.CookieMap(init)` - Create cookie map from string/object/array
- `request.cookies.get(name)` - Read cookie value
- `request.cookies.set(name, value, options)` - Set cookie with httpOnly, secure, sameSite, maxAge
- `request.cookies.delete(name, options)` - Delete cookie
- `request.cookies.toSetCookieHeaders()` - Get Set-Cookie header array

#### Database - bun:sqlite
- `import { Database } from 'bun:sqlite'` - SQLite database class
- `new Database(filename, options)` - Create/open database (supports :memory:, readonly, create)
- `db.query(sql)` - Create prepared statement (cached)
- `db.prepare(sql)` - Prepare statement without caching
- `db.exec(sql)` - Execute SQL statements
- `db.transaction(fn)` - Execute atomic transaction
- `statement.all(params)` - Get all rows as objects
- `statement.get(params)` - Get single row
- `statement.run(params)` - Execute and return { lastInsertRowid, changes }
- `statement.values(params)` - Get rows as arrays
- `statement.as(Class)` - Map results to class instances
- `statement.iterate()` - Iterator for memory-efficient processing
- `db.serialize()` - Serialize database to Uint8Array
- `Database.deserialize(data)` - Deserialize database from Uint8Array

#### File I/O
- `Bun.file(path)` - Reference file (lazy-loaded, doesn't read immediately)
- `file.text()` - Read as string
- `file.bytes()` - Read as Uint8Array
- `file.arrayBuffer()` - Read as ArrayBuffer
- `file.stream()` - Read as ReadableStream
- `file.exists()` - Check if file exists
- `Bun.write(destination, data)` - Write file efficiently (uses sendfile on Linux)
- `file.writer(options)` - Get FileSink for incremental writing
- `writer.write(chunk)` - Write chunk incrementally
- `writer.flush()` - Flush to disk
- `writer.end()` - Close and finalize

#### Streams
- `new ReadableStream({ start(controller) { ... } })` - Create readable stream
- `new ReadableStream({ type: 'direct', pull(controller) { ... } })` - Direct stream (no copying)
- `new Bun.ArrayBufferSink()` - Incremental ArrayBuffer writer
- `sink.write(chunk)` - Add data to sink
- `sink.flush()` - Get buffered data and clear
- `sink.end()` - Finalize and get result
- For async generators: `new Response(async function* { yield data; })`

#### Development & Monitoring
- `development: true` - Enable development error pages
- `server.pendingRequests` - Count of active requests
- `server.pendingWebSockets` - Count of active connections

#### TLS/HTTPS
- `Bun.serve().tls` - TLS configuration object
- `Bun.file()` - Load certificate/key files
- `tls.key` - Private key (string, Buffer, BunFile)
- `tls.cert` - Certificate (string, Buffer, BunFile)
- `tls.passphrase` - Passphrase for encrypted keys
- `tls.ca` - CA certificate
- `tls.serverName` - SNI server name

#### Utilities & Helpers
- `Bun.version` - Current Bun version
- `Bun.revision` - Git commit hash
- `Bun.env` - Alias for process.env
- `Bun.main` - Entrypoint file path
- `Bun.sleep(ms)` - Async delay
- `Bun.which(bin)` - Find executable path
- `Bun.randomUUIDv7(encoding, timestamp)` - Monotonic UUID generation (v7 format)
- `Bun.deepEquals(a, b, strict)` - Deep object comparison
- `Bun.escapeHTML(string)` - HTML escape utility
- `Bun.stringWidth(string, options)` - Terminal string width (emoji & ANSI aware)

#### Password Hashing (Bun.password)
- `Bun.password.hash(password, options)` - Hash with argon2id/bcrypt
- `Bun.password.hashSync(password, options)` - Synchronous hashing
- `Bun.password.verify(password, hash)` - Verify password match
- `Bun.password.verifySync(password, hash)` - Synchronous verification
- Algorithms: argon2id (default), argon2i, argon2d, bcrypt
- Automatic salt generation and PHC/MCF format handling
- Pre-hashing support for passwords > 72 bytes (bcrypt)

#### Cryptographic Hashing (Bun.CryptoHasher)
- `new Bun.CryptoHasher(algorithm, secretKey?)` - Incremental hasher
- Algorithms: blake2b, md5, sha1/224/256/384/512, sha3, shake, ripemd160
- `.update(data, encoding)` - Add data incrementally
- `.digest(encoding)` - Get hash (Uint8Array, hex, base64, etc.)
- HMAC support with secret keys
- `.copy()` - Clone hasher state
- Encoding support: utf8, hex, base64, base64url, latin1, binary, ascii

#### Non-Cryptographic Hashing (Bun.hash)
- `Bun.hash(data, seed?)` - Wyhash (default, fast 64-bit)
- Alternative algorithms: crc32, adler32, cityHash32/64, xxHash32/64/3, murmur32/64, rapidhash
- Support for strings, TypedArray, DataView, ArrayBuffer, SharedArrayBuffer

#### Compression APIs
- `Bun.gzipSync(data, options)` - GZIP compression
- `Bun.gunzipSync(data)` - GZIP decompression
- `Bun.deflateSync(data, options)` - DEFLATE compression
- `Bun.inflateSync(data)` - DEFLATE decompression
- `Bun.zstdCompress(data, options)` - Zstandard async
- `Bun.zstdCompressSync(data, options)` - Zstandard sync
- `Bun.zstdDecompress(data)` - Zstandard decompression
- Compression levels, memory configuration, strategy options

#### Environment Variables & Configuration
- `.env` file support with automatic loading
- Environment-specific files: `.env.production`, `.env.development`, `.env.test`
- Variable expansion in .env files (e.g., `$VARIABLE` references)
- `process.env`, `Bun.env`, `import.meta.env` access
- `--env-file` CLI flag for custom .env locations
- TypeScript interface merging for typed environment variables
- Escape sequences with backslash (`\$` for literal $)

#### Shell Integration (Bun Shell via $` `)
- `import { $ } from 'bun'` - Template literal shell execution
- Cross-platform: Windows, Linux, macOS with native builtins
- Built-in commands: cd, ls, rm, echo, pwd, cat, mkdir, touch, mv, which, exit
- Piping (`|`), redirection (`>`, `<`, `2>`, `&>`, `>>`, `2>>`)
- Command substitution with `$(...)`
- String interpolation with automatic escaping (SQL injection-like prevention)
- Output methods: `.text()`, `.json()`, `.lines()`, `.blob()`
- Error handling: `.quiet()`, `.nothrow()`, `.throws(boolean)`
- Context control: `.env()`, `.cwd()`, `.nothrow()`
- Utilities: `$.escape(string)`, `$.braces(pattern)`

#### Glob Patterns & File Matching
- `new Glob(pattern)` - Create glob matcher
- `.scan(root, options)` - Async directory scanning
- `.scanSync(root, options)` - Sync directory scanning
- `.match(path)` - Test if path matches pattern
- Patterns: `*` (any chars), `**` (recursive), `?` (single char), `[abc]` (char class), `{a,b,c}` (alternation), `!` (negation)
- Options: dot, absolute, followSymlinks, onlyFiles, cwd
- Node.js fs.glob compatibility: array patterns, exclude option

#### Semantic Versioning (Bun.semver)
- `Bun.semver.satisfies(version, range)` - Check version compatibility
- `Bun.semver.order(versionA, versionB)` - Compare versions (-1, 0, 1)
- Supports npm semver: `^`, `~`, ranges, wildcards, x.x.x
- 20x faster than node-semver

#### Object Inspection & Utilities
- `Bun.inspect(object)` - Serialize to string like console.log
- `Bun.inspect.custom` - Custom inspection symbol
- `Bun.inspect.table(data, properties, options)` - Formatted tabular data
- `Bun.nanoseconds()` - High-precision timing in nanoseconds
- `Bun.peek(promise)` - Non-blocking promise inspection
- `Bun.peek.status(promise)` - Get promise status (pending, fulfilled, rejected)
- `Bun.stripANSI(text)` - Remove ANSI escape codes (6-57x faster)
- `Bun.fileURLToPath()` / `Bun.pathToFileURL()` - URL/path conversion
- Stream utilities: `Bun.readableStreamToText()`, `.ToJSON()`, `.ToBytes()`, etc.

### Bun Features to Utilize
- **Route System**: Type-safe route parameters with SIMD-accelerated decoding
  - Static routes for health checks and redirects
  - Dynamic routes with `:param` syntax
  - Wildcard routes for catch-all endpoints
  - Route precedence: exact > parameters > wildcards > fallback
  
- **Cookie Handling**: Built-in `BunRequest.cookies` API
  - Reading cookies from requests
  - Setting cookies with httpOnly, secure, maxAge options
  - Automatic Set-Cookie header management
  - Cookie deletion and expiration
  
- **Error Handling**: Centralized `error` callback
  - Development mode for detailed error pages
  - Custom error responses in production
  - Graceful error management across all endpoints
  
- **Async Operations**: Full async/await support
  - Promise-based route handlers
  - Database query execution
  - External API calls
  
- **TLS/HTTPS**: Production-ready encryption
  - Private key and certificate configuration
  - SNI (Server Name Indication) support
  - Passphrase-protected keys
  
- **Server Metrics**: Built-in monitoring
  - `server.pendingRequests` - Active HTTP requests
  - `server.pendingWebSockets` - Active connections (for real-time features if added)
  - Used for dashboard analytics and rate limiting

### Cookie Management with Bun.Cookie
- **Session Cookies**: HttpOnly, Secure, SameSite flags for security
- **Cookie Lifecycle**: Creation, parsing, serialization, expiration checking
- **CookieMap Interface**: Map-like operations (get, set, delete, iterate)
- **Automatic Header Management**: Route modifications auto-apply to response headers
- **Security Options**:
  - `httpOnly: true` - Prevent JavaScript access (prevent XSS token theft)
  - `secure: true` - Only send over HTTPS
  - `sameSite: 'lax'|'strict'|'none'` - CSRF protection
  - `maxAge` - Session duration in seconds
  - `expires` - Absolute expiration timestamp

### SQLite Database (bun:sqlite)
- **High Performance**: 3-6x faster than better-sqlite3
- **Prepared Statements**: Automatic query caching for repeated executions
- **Parameter Binding**: Named ($param) and positional (?1) parameters prevent SQL injection
- **Atomic Transactions**: Automatic rollback on errors with savepoint support
- **Query Methods**:
  - `.all()` - Get all results as array of objects
  - `.get()` - Get single row
  - `.run()` - Execute with `{ lastInsertRowid, changes }`
  - `.values()` - Get results as array of arrays
  - `.iterate()` - Memory-efficient streaming for large result sets
  - `.as(Class)` - Map results to class instances without constructor
- **Data Type Support**: Automatic conversion between JavaScript and SQLite types
- **BigInt Support**: Handle 64-bit integers safely with `safeIntegers` option
- **WAL Mode**: Write-Ahead Log for concurrent reads and single writer
- **Database Serialization**: Export/import complete database to/from Uint8Array
- **Transaction Variants**: DEFERRED, IMMEDIATE, EXCLUSIVE for different locking strategies

### File I/O with Bun.file & Bun.write
- **Lazy-Loaded Files**: Reference without immediate disk read
- **Zero-Copy Transfers**: Uses `sendfile()` syscall on Linux
- **Multiple Format Support**: Strings, Uint8Array, ArrayBuffer, Response bodies
- **Efficient Writing**: `Bun.write()` optimized for maximum performance
- **Incremental Writing**: `FileSink` for streaming with backpressure handling
- **File Metadata**: Check size, type, existence before reading
- **Directory Operations**: Node.js fs module for mkdir, readdir
- **Use Cases**: 
  - Audit logs writing
  - Database backups
  - File uploads/downloads
  - Streaming large responses

### Streams API
- **ReadableStream**: Web API standard for consuming data chunks
- **Direct Streams**: Zero-copy mode avoiding internal queuing
- **Async Generators**: Convert async functions directly to streams
- **ArrayBufferSink**: Efficient incremental buffer building
- **Memory Efficiency**: Process GB-scale files without loading fully into memory
- **Backpressure Handling**: Automatic flow control for optimal performance
- **Integration**: Works with Response bodies and file transfers

### Environment Variables & Configuration
- **Automatic Loading**: `.env`, `.env.production`, `.env.development`, `.env.test`
- **Variable Expansion**: Reference variables within .env files
- **TypeScript Support**: Interface merging for typed environment access
- **Access Methods**: `process.env`, `Bun.env`, `import.meta.env`
- **CLI Override**: `--env-file` flag for custom locations
- **Security**: Escaping to prevent injection attacks

### Shell Integration (Bun Shell)
- **Cross-Platform**: Native implementation works on Windows, Linux, macOS
- **Command Execution**: Template literal syntax `$\`command\``
- **Built-in Commands**: cd, ls, rm, echo, pwd, cat, mkdir, etc.
- **Piping & Redirection**: Full bash-like syntax support
- **String Escaping**: Automatic protection against shell injection
- **Output Formats**: Text, JSON, lines, blob conversions
- **Error Handling**: Configurable throw/nothrow behavior
- **Performance**: Concurrent execution of shell operations

### Glob Patterns & File Matching
- **Pattern Matching**: `*`, `**`, `?`, `[abc]`, `{a,b,c}`, `!negation`
- **Directory Scanning**: Async and sync file discovery
- **Path Matching**: Test if files match patterns
- **Options**: Follow symlinks, absolute paths, dotfiles, files-only
- **Performance**: Native implementation for fast matching
- **Node.js Compatibility**: Compatible with fs.glob API

### Cryptography & Hashing
- **Password Hashing**: Argon2 (default) and bcrypt with automatic salting
- **Cryptographic Hashing**: SHA, Blake2, SHA3, HMAC support
- **Fast Hashing**: Non-cryptographic algorithms (Wyhash, CityHash, xxHash)
- **Incremental Hashing**: Build hashes from streaming data
- **Compression**: GZIP, DEFLATE, Zstandard with configurable levels
- **Security**: SASL authentication, TLS support, certificate validation

### Semantic Versioning & Utilities
- **Version Comparison**: Fast semver checking (20x faster than node-semver)
- **UUID Generation**: Monotonic v7 UUIDs suitable for databases
- **Object Inspection**: Deep equality checks and formatted output
- **Terminal Utilities**: String width calculation, ANSI stripping
- **HTML Escaping**: Fast HTML entity encoding
- **Performance Timing**: Nanosecond-precision measurement
- **Promise Utilities**: Non-blocking promise inspection

### Response Optimization
- Static responses for frequently accessed endpoints (health checks, fixed configs)
- JSON responses with proper headers
- Efficient response serialization
- Streaming for large payloads
- Incremental file writing for bulk operations

## Testing Strategy & Implementation

### Test Runner Configuration (Bun Test)
- **Framework**: Jest-compatible `bun:test` module
- **Auto-Discovery**: Files matching `*.test.ts`, `*_test.ts`, `*.spec.ts`, `*_spec.ts` patterns
- **Execution**: Runs all tests sequentially within single process
- **TypeScript Support**: Native TypeScript and JSX support
- **Watch Mode**: `bun test --watch` for development
- **Performance**: Concurrent test execution with `--concurrent` flag
- **Timeouts**: Default 5000ms per test, configurable globally or per-test
- **Configuration**: `bunfig.toml` [test] section for defaults
- **CI/CD Integration**: Automatic GitHub Actions annotations

### Test Organization
- **Unit Tests**: Individual function/method testing with mocks
- **Integration Tests**: API endpoint testing with database
- **Lifecycle Hooks**: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`
- **Preload Scripts**: Global setup/teardown via `--preload` flag
- **Test Grouping**: `describe()` blocks for logical test organization
- **Parametrized Tests**: `test.each()` for multiple test cases
- **Conditional Tests**: `test.if()`, `test.skipIf()`, `test.todoIf()` for platform-specific tests

### Test Modifiers & Patterns
- **Skipping**: `test.skip()` and `test.todo()` for deferred tests
- **Only**: `test.only()` and `describe.only()` to run specific tests
- **Failing**: `test.failing()` for tracking known issues
- **Serial**: `test.serial()` to enforce sequential execution
- **Concurrent**: `test.concurrent()` for parallel async tests

### Mock & Spy Support
- **Function Mocks**: `mock()` and `jest.fn()` for creating test functions
- **Mock Properties**: `.calls`, `.results`, `.instances`, `.mock.lastCall`
- **Mock Methods**: `mockImplementation()`, `mockReturnValue()`, `mockResolvedValue()`, etc.
- **Spy Functions**: `spyOn()` to track existing functions without replacement
- **Module Mocks**: `mock.module()` to override imports before execution
- **Mock Restoration**: `mock.restore()` and `mock.clearAllMocks()` for cleanup
- **Vitest Compatibility**: `vi` alias for Jest mocking API

### Assertion Matchers
- **Basic**: `.toBe()`, `.toEqual()`, `.toStrictEqual()`, `.not`
- **Truthiness**: `.toBeNull()`, `.toBeUndefined()`, `.toBeDefined()`, `.toBeTruthy()`, `.toBeFalsy()`
- **Numbers**: `.toBeCloseTo()`, `.toBeGreaterThan()`, `.toBeLessThan()`, `.toBeGreaterThanOrEqual()`
- **Strings/Arrays**: `.toContain()`, `.toMatch()`, `.toHaveLength()`, `.toContainEqual()`
- **Objects**: `.toHaveProperty()`, `.toMatchObject()`, `.toContainValue()`, `.toContainAllKeys()`
- **Functions**: `.toThrow()`, `.toBeInstanceOf()`, `.toHaveBeenCalled()`, `.toHaveBeenCalledWith()`
- **Promises**: `.resolves()`, `.rejects()` for async matchers
- **Mock**: `.toHaveBeenCalledTimes()`, `.toHaveReturned()`, `.toHaveReturnedWith()`
- **Snapshots**: `.toMatchSnapshot()`, `.toMatchInlineSnapshot()`

### Snapshot Testing
- **File-Based**: Snapshots stored in `__snapshots__/` directory
- **Inline Snapshots**: Embedded directly in test files with `.toMatchInlineSnapshot()`
- **Error Snapshots**: `.toThrowErrorMatchingSnapshot()` for exception matching
- **Updates**: `bun test --update-snapshots` to refresh snapshots
- **Property Matchers**: Handle dynamic values in snapshots
- **Custom Serializers**: `expect.addSnapshotSerializer()` for special objects

### Code Coverage
- **Enable**: `bun test --coverage` or `coverage = true` in `bunfig.toml`
- **Reporters**: Text (console) and LCOV (file-based) formats
- **Thresholds**: Set minimum coverage requirements to fail tests
- **Exclusions**: `coveragePathIgnorePatterns` for skipping files
- **Skip Test Files**: `coverageSkipTestFiles = true` to exclude test code
- **Output**: `coverageDir = "coverage"` for report location
- **Metrics**: Lines, Functions, Statements tracked separately

### CI/CD Integration
- **GitHub Actions**: Automatic annotations and status checks
- **JUnit XML**: `bun test --reporter=junit --reporter-outfile=./bun.xml`
- **Codecov**: LCOV format compatible with coverage services
- **Parallel Execution**: `--concurrent --max-concurrency 20` for CI environments
- **Bail on Failure**: `--bail` flag to stop early on failures
- **Randomization**: `--randomize` and `--seed` for order-dependent bug detection

### Test Execution Commands
```
bun test                                    # Run all tests
bun test utils                              # Run tests matching "utils"
bun test ./test/specific.test.ts           # Run specific file
bun test --test-name-pattern "addition"    # Filter by test name
bun test --watch                           # Watch mode with auto-rerun
bun test --concurrent                      # Enable concurrent execution
bun test --coverage                        # Generate coverage report
bun test --update-snapshots                # Update snapshot files
bun test --bail                            # Stop after first failure
bun test --timeout 10000                   # Set per-test timeout
bun test --rerun-each 5                    # Rerun each test 5 times
```

### Test File Structure
- **Setup Preload**: Global test setup in preload script loaded before tests
- **Per-File Setup**: `beforeAll`/`afterAll` at file level for shared resources
- **Per-Describe Setup**: Lifecycle hooks within `describe()` blocks
- **Per-Test Setup**: `beforeEach`/`afterEach` for test-specific cleanup
- **Describe Nesting**: Multiple levels of grouping for organization
- **Test Organization**: Group related tests in describe blocks for clarity

### Testing Best Practices for E-Commerce Backend
- **Unit Testing**: Test business logic (calculations, validations, transformations)
- **API Testing**: Test all HTTP endpoints with various input scenarios
- **Database Testing**: Mock or use test database for data operations
- **Error Cases**: Test error handling, validation failures, edge cases
- **Authentication**: Test JWT verification, session validation, authorization
- **Data Integrity**: Test transaction handling, stock updates, order consistency
- **Performance**: Test response times, large dataset handling, concurrent requests
- **Security**: Test input validation, SQL injection prevention, XSS handling
- **Race Conditions**: Test concurrent operations (simultaneous orders, stock conflicts)

### Test Metrics & Reporting
- **Coverage Reports**: Identify untested code paths
- **Flaky Tests**: Use `--rerun-each` to detect non-deterministic failures
- **Performance Baseline**: Measure test execution speed
- **Exit Codes**: 0 (pass), 1 (failures), >1 (unhandled errors)
- **Test Summary**: Total passed/failed/skipped/todo counts
- **Execution Time**: Individual and aggregate test duration

## Production Deployment & Optimization

### Standalone Executable Compilation
- **Build Command**: `bun build --compile --outfile myapp ./index.ts`
- **Single File**: Bundles entire runtime, code, and dependencies into one executable
- **No Runtime Required**: Servers and users don't need Bun installed
- **Zero Dependencies**: All imports and packages included in binary
- **Instant Startup**: No transpilation overhead on startup

### Cross-Platform Compilation
- **Linux x64**: `bun build --compile --target=bun-linux-x64 ./index.ts --outfile myapp`
- **Linux ARM64**: `bun build --compile --target=bun-linux-arm64 ./index.ts --outfile myapp`
- **Windows x64**: `bun build --compile --target=bun-windows-x64 ./index.ts --outfile myapp`
- **macOS x64**: `bun build --compile --target=bun-darwin-x64 ./index.ts --outfile myapp`
- **macOS ARM64**: `bun build --compile --target=bun-darwin-arm64 ./index.ts --outfile myapp`
- **Baseline CPUs**: Use `-baseline` for pre-2013 CPU compatibility (nehalem)
- **Modern CPUs**: Use `-modern` for 2013+ CPUs with AVX2 (haswell)
- **musl libc**: Use `-musl` target for Alpine Linux compatibility

### Minification for Production
- **Enable All**: `bun build --minify ./index.ts --outfile=out.js` (80%+ size reduction)
- **Whitespace**: Removes all unnecessary whitespace and formatting
- **Syntax**: Constant folding, dead code elimination, expression optimization
- **Identifiers**: Renames variables to single letters (frequency-based)
- **Keep Names**: `--keep-names` preserves function/class names for debugging
- **Granular Control**: `--minify-whitespace`, `--minify-syntax`, `--minify-identifiers` individually

### Bytecode Caching for Speed
- **Enable**: `bun build --bytecode ./index.ts --outdir=./dist`
- **Startup Speed**: 2-4x faster execution (parsing moved to build time)
- **Format**: Generates `.js` and `.jsc` files (must deploy both)
- **Best For**: CLIs, frequent invocations, serverless cold starts
- **Size Tradeoff**: 2-8x larger files (compresses well with gzip/brotli)
- **Limitations**: CommonJS only (no top-level await), version-tied to Bun release
- **CI/CD**: Regenerate bytecode when updating Bun versions

### Production Build Configuration
```bash
# Recommended production build command:
bun build --compile --minify --sourcemap --bytecode \
  ./src/index.ts --outfile myapp

# Explanation:
# --compile: Create standalone executable
# --minify: Reduce size and optimize code
# --sourcemap: Preserve error reporting with zstd compression
# --bytecode: Pre-compile to bytecode for faster startup
# Result: Single optimized binary with full debuggability
```

### Build-Time Constants
- **Define**: `--define BUILD_VERSION='"1.2.3"' --define BUILD_TIME='"2024-01-15T10:30:00Z"'`
- **Embedded**: Constants compiled directly into binary (zero runtime overhead)
- **Dead Code Elimination**: Unused code paths removed based on constants
- **Use Cases**: Version numbers, build timestamps, feature flags, environment identifiers

### Embedded Assets & SQLite
- **Embed Files**: Import with `type: 'file'` attribute in import
- **Embed SQLite**: Use `embed: 'true'` with `type: 'sqlite'` for read-write in-memory databases
- **Access**: Use `Bun.file()`, `Bun.embeddedFiles`, or standard `fs` APIs
- **Asset Hashing**: Content-based naming for cache busting (disable with `--asset-naming="[name].[ext]"`)
- **Embedded List**: `Bun.embeddedFiles` returns array of embedded Blob objects

### Windows-Specific Compilation
- **Icon**: `--windows-icon=path/to/icon.ico` to customize executable icon
- **Hide Console**: `--windows-hide-console` for GUI applications without terminal
- **Limitation**: Cannot be used when cross-compiling (requires Windows APIs)

### macOS Code Signing
- **CodesSign**: `codesign --deep --force --sign "XXXXXXXXXX" ./myapp`
- **JIT Support**: Include entitlements.plist with JIT permissions
- **Verification**: `codesign -vvv --verify ./myapp`
- **Requirement**: Bun v1.2.4 or newer for full support

### Deployment Strategies

#### Docker Deployment
```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun build --compile --minify --bytecode \
  ./src/index.ts --outfile ./app

FROM scratch
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
```

#### Single Binary Deployment
- Copy compiled executable to server
- No runtime, dependencies, or configuration files needed
- Executable works on matching OS/architecture
- Database file (SQLite) deployed separately if not embedded
- Environment variables via `.env` file or system environment

#### Containerization
- Base image: `oven/bun:1` (official Bun Docker image)
- Multi-stage builds: Compile in builder stage, deploy minimal image
- Scratch image: Use `FROM scratch` for ultra-minimal deployment
- Size: Compiled binary typically 20-50MB (includes Bun runtime)

#### Cloud Deployment
- **AWS Lambda**: Compile for `bun-linux-arm64`, deploy as custom runtime
- **Heroku**: Compile binary, deploy with `Procfile`
- **Railway**: Push compiled binary directly to container
- **Vercel**: Full-stack apps with compiled executables
- **DigitalOcean**: Deploy compiled binary to Droplets

### Performance Optimization
- **Bytecode**: Pre-compilation reduces parsing overhead
- **Minification**: Smaller code = faster transmission and parsing
- **Sourcemaps**: Compressed zstd format for error reporting without size penalty
- **Build Cache**: Use `--bytecode` to cache expensive parsing operations
- **Async Operations**: Ensure SQLite WAL mode for concurrent access
- **Connection Pooling**: Maintain database connection efficiency

### Monitoring & Debugging
- **Sourcemaps**: Embedded zstd-compressed sourcemaps preserve stack traces
- **Error Reporting**: Stack traces automatically decompress and resolve to original code
- **Build Artifacts**: Generate in CI/CD pipeline, not on server
- **Version Tracking**: Include build version/timestamp for deployment tracking
- **Health Checks**: Static response endpoints for load balancer verification

### Deployment Checklist
- ✅ Build with `--compile --minify --sourcemap --bytecode`
- ✅ Test compiled executable on target platform
- ✅ Verify cross-platform target matches server architecture
- ✅ Configure environment variables for production
- ✅ Set up SQLite database file location
- ✅ Configure TLS certificates for HTTPS
- ✅ Set up logging and monitoring
- ✅ Configure rate limiting and security headers
- ✅ Test database backup procedures
- ✅ Document rollback procedures
- ✅ Set up health check endpoints
- ✅ Configure automatic restarts (systemd, supervisor, etc.)

## Development Workflow

All features will be implemented following this production standard:
- Complete feature implementation
- Comprehensive endpoint coverage
- Full error handling with centralized error handler
- Security implementation (TLS, validation, rate limiting)
- Cookie-based session management
- Performance optimization using Bun's SIMD routing
- Server metrics integration
- No placeholder or future code
- Production-ready from day one

