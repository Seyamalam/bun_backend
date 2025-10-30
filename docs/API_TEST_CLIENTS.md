# API Test Clients

Two standalone Bun scripts to test the E-Commerce Backend API using `fetch` - no Postman needed!

---

## 📋 Quick Test Script (`quick-test.ts`)

Simple, fast command-line interface for quick API testing.

### Installation & Running

```bash
# Single command test
bun quick-test.ts health
bun quick-test.ts status
bun quick-test.ts products
```

### Available Commands

**Health & Status:**
```bash
bun quick-test.ts health           # Test /health endpoint
bun quick-test.ts status           # Test /api/v1/status endpoint
```

**Authentication:**
```bash
bun quick-test.ts register john@example.com Password123!
bun quick-test.ts login john@example.com Password123!
```

**Browse Data:**
```bash
bun quick-test.ts products         # List all products
bun quick-test.ts categories       # List all categories
bun quick-test.ts coupons          # List all coupons
```

### Examples

```bash
# Test server is running
bun quick-test.ts health

# Create new user
bun quick-test.ts register user@example.com MyPassword123!

# Login user
bun quick-test.ts login user@example.com MyPassword123!

# Browse products
bun quick-test.ts products

# View all available coupons
bun quick-test.ts coupons
```

---

## 🎮 Full Interactive Client (`api-client.ts`)

Complete interactive menu for comprehensive API testing.

### Running

```bash
# Start interactive mode
bun api-client.ts

# Or run single command
bun api-client.ts health
bun api-client.ts all
bun api-client.ts register
```

### Interactive Menu

When you run `bun api-client.ts` without arguments, you get an interactive menu:

```
╔════════════════════════════════════════╗
║   E-Commerce Backend API Test Client  ║
╚════════════════════════════════════════╝

Available Commands:

  1. health          - Test /health endpoint
  2. status          - Test /api/v1/status endpoint
  3. register        - Register new user
  4. login           - Login user
  5. me              - Get current user
  6. products        - List products
  7. product         - Get single product
  8. categories      - List categories
  9. cart            - Get cart
  10. add-to-cart    - Add product to cart
  11. orders         - List orders
  12. coupons        - List coupons
  13. validate-coupon - Validate coupon
  14. reviews        - Get product reviews
  15. submit-review  - Submit review
  16. all            - Run all tests
  17. clear          - Clear stored data
  18. exit           - Exit program

Current State:
  Token: Not set
  User ID: Not set
  User Email: Not set
  Product ID: Not set
  Cart ID: Not set
  Order ID: Not set

Enter command (1-18): 
```

### Testing Workflow

1. **Start server** (in separate terminal)
   ```bash
   bun run dev
   ```

2. **Run test client** (in another terminal)
   ```bash
   bun api-client.ts
   ```

3. **Follow these steps in order**
   - Press `3` to register new user
   - Press `4` to login
   - Press `5` to check current user
   - Press `6` to list products
   - Press `9` to view cart
   - Press `10` to add to cart
   - Press `12` to view coupons
   - And more...

---

## 🔐 Typical Testing Sequence

### Full User Journey

```bash
# 1. Register new user
bun quick-test.ts register alice@example.com Alice123!
# Save the token from response

# 2. Login (or use token from registration)
bun quick-test.ts login alice@example.com Alice123!
# Save this token

# 3. List products
bun quick-test.ts products
# Note a product ID

# 4. Add to cart (requires token, so use api-client.ts interactive mode for this)
bun api-client.ts
# Select options 3 → 4 → 6 → 10

# 5. Create order
# Use api-client.ts interactive mode

# 6. Process payment
# Use api-client.ts interactive mode
```

### Or use Full Interactive Client

```bash
# Start interactive mode
bun api-client.ts

# Then select:
# 3 - Register
# 4 - Login
# 6 - List Products
# 9 - Get Cart
# 10 - Add to Cart
# 16 - Run all tests
```

---

## 🛠️ Direct Integration Examples

### Fetch Health Check

```bash
bun -e "
const res = await fetch('http://localhost:3000/health');
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
"
```

### Register User

```bash
bun -e "
const res = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!',
    password_confirm: 'Password123!',
    first_name: 'John',
    last_name: 'Doe'
  })
});
console.log(await res.json());
"
```

### Login and Get Token

```bash
bun -e "
const res = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!'
  })
});
const data = await res.json();
console.log('Token:', data.data.token);
"
```

### Get Current User (with Token)

```bash
bun -e "
const token = 'YOUR_TOKEN_HERE';
const res = await fetch('http://localhost:3000/api/v1/auth/me', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
console.log(await res.json());
"
```

---

## 📊 Output Examples

### Health Check Response

```json
{
  "status": "healthy",
  "uptime": 1234.567,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### User Registration Response

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "token": "eyJhbGc..."
  }
}
```

### Product List Response

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
        "rating": 4.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150
    }
  }
}
```

---

## 🚀 Advanced Usage

### Batch Testing

Create `test-batch.ts`:

```typescript
#!/usr/bin/env bun

const BASE = 'http://localhost:3000/api/v1';

async function test(name: string, method: string, url: string, body?: any) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await res.json();
  console.log(`\n✓ ${name}`);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

// Run tests
await test('Health', 'GET', '/health');
await test('Products', 'GET', '/products?page=1&limit=5');
await test('Categories', 'GET', '/categories');
```

Run it:
```bash
bun test-batch.ts
```

### Performance Testing

```bash
# Test response time
bun -e "
for (let i = 0; i < 10; i++) {
  const start = Date.now();
  const res = await fetch('http://localhost:3000/api/v1/products');
  const time = Date.now() - start;
  console.log(\`Request \${i + 1}: \${time}ms\`);
}
"
```

### Load Testing

```bash
# Simple load test (100 concurrent requests)
bun -e "
const start = Date.now();
const promises = Array(100).fill(null).map(() =>
  fetch('http://localhost:3000/health')
);
await Promise.all(promises);
console.log('100 requests completed in', Date.now() - start, 'ms');
"
```

---

## 🔒 Token Management

### Save Token for Later Use

```bash
# Get token
bun quick-test.ts login user@example.com password > login-response.json

# Extract token
TOKEN=$(cat login-response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Saved token: $TOKEN"
```

### Use Token in Multiple Requests

```bash
bun -e "
const token = 'YOUR_TOKEN_HERE';

// Get current user
const me = await (await fetch('http://localhost:3000/api/v1/auth/me', {
  headers: { Authorization: \`Bearer \${token}\` }
})).json();
console.log('User:', me.data.email);

// Get cart
const cart = await (await fetch('http://localhost:3000/api/v1/cart', {
  headers: { Authorization: \`Bearer \${token}\` }
})).json();
console.log('Cart items:', cart.data.items.length);
"
```

---

## 📝 Writing Custom Tests

Create `my-test.ts`:

```typescript
#!/usr/bin/env bun

const API = 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  status: string;
  data?: T;
  errors?: any[];
}

async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return await res.json();
}

// Your test code
const users = await apiCall<any>('GET', '/users?page=1&limit=5');
console.log('Users:', users.data?.items?.length);

const products = await apiCall<any>('GET', '/products');
console.log('Products:', products.data?.items?.length);
```

Run it:
```bash
bun my-test.ts
```

---

## 🐛 Troubleshooting

### "Connection refused"
Server not running. Start it first:
```bash
bun run dev
```

### "Not authenticated"
You need to login first or pass valid token:
```bash
bun api-client.ts
# Then select: 3 (register) → 4 (login)
```

### "Invalid request body"
Check JSON format and required fields. Use `--verbose`:
```bash
bun -e "
const res = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!',
    password_confirm: 'Test123!',
    first_name: 'Test',
    last_name: 'User'
  }),
  verbose: true
});
console.log(await res.json());
" 2>&1 | head -50
```

---

## 🎯 Common Test Scenarios

### Scenario 1: Full Auth Flow

```bash
# Terminal 1: Start server
bun run dev

# Terminal 2: Run tests
bun api-client.ts
# Select: 3, 4, 5 in sequence
```

### Scenario 2: Shopping Cart

```bash
bun api-client.ts
# Select: 3, 4, 6, 9, 10, 9 (view updated cart)
```

### Scenario 3: Products & Reviews

```bash
bun api-client.ts
# Select: 6, 7, 14, 3, 15
```

### Scenario 4: Coupons

```bash
bun api-client.ts
# Select: 12, 13 (validate first coupon)
```

---

## 📚 Additional Resources

- [Bun Fetch Documentation](https://bun.sh/docs/runtime/http#fetch)
- [API Reference](./API_REFERENCE.md)
- [Project README](./README.md)
- [Quick Start Guide](./QUICKSTART.md)

---

## ✨ Features

✅ Zero dependencies (just Bun)  
✅ Colored terminal output  
✅ State tracking across requests  
✅ JSON pretty-printing  
✅ Response timing  
✅ Error handling  
✅ Interactive and CLI modes  

---

**Happy Testing! 🎉**
