# Go E-Commerce Backend

A high-performance e-commerce backend API built with Go and the Gin framework, recreated from the Bun/TypeScript implementation.

## Features

- ✅ **RESTful API** with comprehensive endpoints
- ✅ **JWT Authentication** for secure user sessions
- ✅ **SQLite Database** with optimized queries
- ✅ **Rate Limiting** to prevent abuse
- ✅ **CORS Support** for frontend integration
- ✅ **Security Headers** for production deployment
- ✅ **Gin Framework** for high performance
- ✅ **Graceful Shutdown** handling

## Tech Stack

- **Language**: Go 1.24+
- **Framework**: Gin Web Framework
- **Database**: SQLite3 with WAL mode
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Project Structure

```
go_backend/
├── cmd/
│   ├── api/           # Main application entry point
│   └── benchmark/     # Benchmark tool
├── internal/
│   ├── database/      # Database schema and initialization
│   ├── handlers/      # HTTP request handlers
│   ├── middleware/    # Authentication, rate limiting
│   ├── models/        # Data models
│   └── utils/         # Helper functions
├── bin/               # Compiled binaries
└── go.mod             # Go module dependencies
```

## Installation

1. **Prerequisites**:
   - Go 1.24 or higher
   - SQLite3

2. **Install Dependencies**:
   ```bash
   cd go_backend
   go mod download
   ```

3. **Build the Application**:
   ```bash
   go build -o bin/server ./cmd/api/main.go
   ```

## Usage

### Run the Server

```bash
# Default configuration (port 3001)
./bin/server

# Custom port
PORT=8080 ./bin/server

# Disable rate limiting
ENABLE_RATE_LIMIT=false ./bin/server

# Production mode
NODE_ENV=production PORT=8080 ./bin/server
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production)
- `ENABLE_RATE_LIMIT` - Enable/disable rate limiting (default: true)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user (protected)

### Products
- `GET /api/v1/products` - List all products (with pagination)
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (protected)

### Categories
- `GET /api/v1/categories` - List all categories
- `POST /api/v1/categories` - Create category (protected)

### Cart (Protected)
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `DELETE /api/v1/cart/items/:itemId` - Remove item from cart
- `DELETE /api/v1/cart` - Clear cart

### Orders (Protected)
- `GET /api/v1/orders` - List user's orders
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders/:id` - Get order details
- `DELETE /api/v1/orders/:id` - Cancel order

### Health
- `GET /health` - Health check
- `GET /api/v1/status` - API status

## Development

### Build for Development
```bash
go build -o bin/server ./cmd/api/main.go
```

### Run Tests
```bash
go test ./...
```

### Build for Production
```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o bin/server-linux ./cmd/api/main.go

# macOS
GOOS=darwin GOARCH=arm64 go build -o bin/server-macos ./cmd/api/main.go

# Windows
GOOS=windows GOARCH=amd64 go build -o bin/server-windows.exe ./cmd/api/main.go
```

## Benchmarking

### Using the Go Benchmark Tool
```bash
# Build benchmark tool
go build -o bin/benchmark ./cmd/benchmark/main.go

# Run benchmark
./bin/benchmark -url http://localhost:3001 -duration 30 -concurrency 50

# Custom parameters
./bin/benchmark -url http://localhost:3001 -duration 60 -concurrency 100 -warmup 10
```

### Compare with Bun Backend
```bash
# From the project root
./compare-backends.sh [duration] [concurrency]

# Example: 60 second test with 100 concurrent requests
./compare-backends.sh 60 100
```

## Performance Optimizations

1. **Connection Pooling**: Database connections are pooled and reused
2. **WAL Mode**: SQLite Write-Ahead Logging for better concurrency
3. **Prepared Statements**: SQL queries are optimized
4. **Middleware Caching**: Authentication tokens are validated efficiently
5. **Gin Framework**: High-performance HTTP routing and handling

## Security Features

- JWT-based authentication
- bcrypt password hashing
- Rate limiting (configurable)
- CORS support
- Security headers (XSS, CSP, etc.)
- SQL injection prevention via prepared statements

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts
- `products` - Product catalog
- `categories` - Product categories
- `carts` - Shopping carts
- `cart_items` - Cart contents
- `orders` - Order history
- `order_items` - Order details
- `payments` - Payment records
- `coupons` - Discount coupons
- `reviews` - Product reviews

## License

MIT License
