# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Server
```bash
cd c:\Users\user\Desktop\bun_backend
bun run dev
```

You should see:
```
🚀 E-Commerce Backend Server running on http://localhost:3000
📝 Environment: development
🗄️ Database: Connected
⏱️ Rate limiting: Enabled
```

### Step 2: Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 1.234,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Step 3: Create an Account
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

Response:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "token": "jwt-token-here"
  }
}
```

**Save the token!** You'll use it for authenticated requests.

### Step 4: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Step 5: Access Protected Endpoint
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

---

## 📋 Common Tasks

### Create an Admin User
```bash
# First, create a regular user (see Step 3)
# Then manually update the database:
sqlite3 ecommerce.db
> UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Create a Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -d '{
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "sku": "LAPTOP-001",
    "price": 1299.99,
    "category_id": "cat-id",
    "vendor_id": "vendor-id",
    "stock": 50
  }'
```

### Add Product to Cart
```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer USER_TOKEN' \
  -d '{
    "product_id": "product-id",
    "quantity": 2
  }'
```

### View Cart
```bash
curl http://localhost:3000/api/v1/cart \
  -H 'Authorization: Bearer USER_TOKEN'
```

### Create an Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer USER_TOKEN' \
  -d '{
    "shipping_address_id": "address-id",
    "billing_address_id": "address-id",
    "shipping_method_id": "method-id",
    "payment_method": "credit_card"
  }'
```

---

## 🧪 Testing with Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import the included `postman_collection.json`:
   - Open Postman
   - Click "Import"
   - Select the `postman_collection.json` file
3. Update the `YOUR_TOKEN_HERE` placeholders with real tokens
4. Run requests directly from Postman

---

## 📚 API Documentation

Full API documentation is available in `README.md`.

Key endpoints:
- **Health**: `GET /health`, `GET /api/v1/status`
- **Auth**: `/api/v1/auth/*` (register, login, logout, etc.)
- **Users**: `/api/v1/users/*` (profile, addresses)
- **Products**: `/api/v1/products/*` (list, create, update, delete)
- **Cart**: `/api/v1/cart/*` (view, add, update, remove)
- **Orders**: `/api/v1/orders/*` (create, view, cancel)
- **Payments**: `/api/v1/payments/*` (process, view)
- **Coupons**: `/api/v1/coupons/*` (list, validate)
- **Reviews**: `/api/v1/reviews/*` (submit, view, delete)

---

## 🔧 Database Management

### Access Database Directly
```bash
sqlite3 ecommerce.db
```

### Common Queries
```sql
-- View all users
SELECT id, email, first_name, role FROM users;

-- View all products
SELECT id, name, price, stock FROM products;

-- View all orders
SELECT id, user_id, total_amount, status FROM orders;

-- View database statistics
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as order_count FROM orders;
```

### Backup Database
```bash
cp ecommerce.db ecommerce.db.backup
```

### Restore Database
```bash
cp ecommerce.db.backup ecommerce.db
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force

# Linux/macOS
lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill -9
```

### "Database locked"
```bash
# Remove WAL files
rm ecommerce.db-shm ecommerce.db-wal
```

### Server crashes on startup
```bash
# Check for TypeScript errors
bun --check index.ts

# Check environment variables
cat .env
```

### Cannot connect to database
```bash
# Verify database file exists
ls -la ecommerce.db

# Ensure write permissions
chmod 644 ecommerce.db
```

---

## 🎯 Next Steps

1. **Run Tests**: `bun test`
2. **Check Logs**: Review console output for errors
3. **Explore API**: Try different endpoints
4. **Build for Production**: `bun run build`
5. **Deploy**: Use Docker or cloud platforms

---

## 📞 Support

- Review [SETUP.md](./SETUP.md) for detailed setup instructions
- Check [README.md](./README.md) for comprehensive API docs
- Review [PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md) for project specifications

Happy coding! 🎉
