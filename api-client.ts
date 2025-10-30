#!/usr/bin/env bun
/**
 * E-Commerce Backend API Test Client
 * 
 * A standalone Bun script to test all API endpoints using fetch
 * 
 * Usage:
 *   bun api-client.ts              # Run interactive menu
 *   bun api-client.ts [command]    # Run specific command
 * 
 * Commands:
 *   health, auth, products, cart, orders, all, clear
 */

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

// Store state
let authToken: string = '';
let userId: string = '';
let userEmail: string = '';
let productId: string = '';
let cartId: string = '';
let orderId: string = '';

// Color codes for terminal output
const colors: Record<string, string> = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Print colored output
 */
function log(message: string, color: string = 'reset') {
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

/**
 * Pretty print JSON response
 */
function printJson(data: any) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Make HTTP request and handle response
 */
async function request(
  method: string,
  endpoint: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const options: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...headers },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const startTime = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    const data = (await response.json()) as Record<string, any>;
    
    log(`\n[${method}] ${endpoint} (${duration}ms)`, 'cyan');
    log(`Status: ${response.status}`, response.ok ? 'green' : 'red');
    
    if (response.ok) {
      console.log('Response:');
      printJson(data);
    } else {
      console.log('Error:');
      printJson(data);
    }

    return data;
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    return null;
  }
}

/**
 * Test health endpoint
 */
async function testHealth() {
  log('\n=== Testing Health Endpoint ===', 'bright');
  await request('GET', '/health');
}

/**
 * Test status endpoint
 */
async function testStatus() {
  log('\n=== Testing Status Endpoint ===', 'bright');
  await request('GET', '/api/v1/status');
}

/**
 * Test user registration
 */
async function testRegister() {
  log('\n=== Testing User Registration ===', 'bright');
  
  userEmail = `user_${Date.now()}@example.com`;
  log(`Registering user: ${userEmail}`, 'yellow');

  const response = await request('POST', '/auth/register', {
    email: userEmail,
    password: 'Password123!',
    password_confirm: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
  });

  if (response && (response as Record<string, any>).data?.user_id) {
    userId = (response as Record<string, any>).data.user_id;
    authToken = (response as Record<string, any>).data.token;
    log(`✓ Registered successfully. User ID: ${userId}`, 'green');
  }
}

/**
 * Test user login
 */
async function testLogin() {
  log('\n=== Testing User Login ===', 'bright');

  if (!userEmail) {
    log('No user registered yet. Run register first.', 'yellow');
    return;
  }

  const response = await request('POST', '/auth/login', {
    email: userEmail,
    password: 'Password123!',
  });

  if (response && (response as Record<string, any>).data?.user_id) {
    userId = (response as Record<string, any>).data.user_id;
    authToken = (response as Record<string, any>).data.token;
    log(`✓ Logged in successfully. Token: ${authToken.substring(0, 20)}...`, 'green');
  }
}

/**
 * Get current user
 */
async function testGetCurrentUser() {
  log('\n=== Testing Get Current User ===', 'bright');

  if (!authToken) {
    log('Not authenticated. Run login first.', 'yellow');
    return;
  }

  await request('GET', '/auth/me');
}

/**
 * Test product listing
 */
async function testListProducts() {
  log('\n=== Testing List Products ===', 'bright');

  const response = await request('GET', '/products?page=1&limit=10');
  
  if (response && (response as Record<string, any>).data?.items?.[0]?.id) {
    productId = (response as Record<string, any>).data.items[0].id;
    log(`✓ Found ${(response as Record<string, any>).data.items.length} products. Using first: ${productId}`, 'green');
  }
}

/**
 * Test get single product
 */
async function testGetProduct() {
  log('\n=== Testing Get Product ===', 'bright');

  if (!productId) {
    log('No product ID. Run listProducts first.', 'yellow');
    return;
  }

  await request('GET', `/products/${productId}`);
}

/**
 * Test list categories
 */
async function testListCategories() {
  log('\n=== Testing List Categories ===', 'bright');
  await request('GET', '/categories');
}

/**
 * Test get cart
 */
async function testGetCart() {
  log('\n=== Testing Get Cart ===', 'bright');

  if (!authToken) {
    log('Not authenticated. Run login first.', 'yellow');
    return;
  }

  const response = await request('GET', '/cart');
  
  if (response && (response as Record<string, any>).data?.cart_id) {
    cartId = (response as Record<string, any>).data.cart_id;
  }
}

/**
 * Test add to cart
 */
async function testAddToCart() {
  log('\n=== Testing Add to Cart ===', 'bright');

  if (!authToken) {
    log('Not authenticated. Run login first.', 'yellow');
    return;
  }

  if (!productId) {
    log('No product ID. Run listProducts first.', 'yellow');
    return;
  }

  await request('POST', '/cart/items', {
    product_id: productId,
    quantity: 1,
  });
}

/**
 * Test list orders
 */
async function testListOrders() {
  log('\n=== Testing List Orders ===', 'bright');

  if (!authToken) {
    log('Not authenticated. Run login first.', 'yellow');
    return;
  }

  const response = await request('GET', '/orders?page=1&limit=10');
  
  if (response && (response as Record<string, any>).data?.items?.[0]?.id) {
    orderId = (response as Record<string, any>).data.items[0].id;
  }
}

/**
 * Test list coupons
 */
async function testListCoupons() {
  log('\n=== Testing List Coupons ===', 'bright');
  await request('GET', '/coupons');
}

/**
 * Test validate coupon
 */
async function testValidateCoupon() {
  log('\n=== Testing Validate Coupon ===', 'bright');

  // First list coupons to get a valid code
  const response = await request('GET', '/coupons');
  
  if (response && (response as Record<string, any>).data?.[0]?.code) {
    const couponCode = (response as Record<string, any>).data[0].code;
    log(`Using coupon code: ${couponCode}`, 'yellow');

    await request('POST', '/coupons/validate', {
      code: couponCode,
      order_total: 150.00,
    });
  } else {
    log('No coupons available', 'yellow');
  }
}

/**
 * Test product reviews
 */
async function testGetReviews() {
  log('\n=== Testing Get Product Reviews ===', 'bright');

  if (!productId) {
    log('No product ID. Run listProducts first.', 'yellow');
    return;
  }

  await request('GET', `/products/${productId}/reviews`);
}

/**
 * Test submit review
 */
async function testSubmitReview() {
  log('\n=== Testing Submit Review ===', 'bright');

  if (!authToken) {
    log('Not authenticated. Run login first.', 'yellow');
    return;
  }

  if (!productId) {
    log('No product ID. Run listProducts first.', 'yellow');
    return;
  }

  await request('POST', '/reviews', {
    product_id: productId,
    rating: 5,
    title: 'Great product!',
    comment: 'Very satisfied with this purchase.',
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n\n╔════════════════════════════════════════╗', 'blue');
  log('║   E-Commerce Backend API Test Suite   ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');

  await testHealth();
  await testStatus();
  await testRegister();
  await testLogin();
  await testGetCurrentUser();
  await testListProducts();
  await testGetProduct();
  await testListCategories();
  await testGetCart();
  await testAddToCart();
  await testListOrders();
  await testListCoupons();
  await testValidateCoupon();
  await testGetReviews();
  await testSubmitReview();

  log('\n\n╔════════════════════════════════════════╗', 'blue');
  log('║        All Tests Completed! ✓          ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');
}

/**
 * Interactive menu
 */
async function showMenu() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   E-Commerce Backend API Test Client  ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');

  log('Available Commands:\n', 'bright');
  log('  1. health          - Test /health endpoint', 'cyan');
  log('  2. status          - Test /api/v1/status endpoint', 'cyan');
  log('  3. register        - Register new user', 'cyan');
  log('  4. login           - Login user', 'cyan');
  log('  5. me              - Get current user', 'cyan');
  log('  6. products        - List products', 'cyan');
  log('  7. product         - Get single product', 'cyan');
  log('  8. categories      - List categories', 'cyan');
  log('  9. cart            - Get cart', 'cyan');
  log('  10. add-to-cart    - Add product to cart', 'cyan');
  log('  11. orders         - List orders', 'cyan');
  log('  12. coupons        - List coupons', 'cyan');
  log('  13. validate-coupon - Validate coupon', 'cyan');
  log('  14. reviews        - Get product reviews', 'cyan');
  log('  15. submit-review  - Submit review', 'cyan');
  log('  16. all            - Run all tests', 'cyan');
  log('  17. clear          - Clear stored data', 'cyan');
  log('  18. exit           - Exit program\n', 'cyan');

  log('Current State:', 'yellow');
  log(`  Token: ${authToken ? authToken.substring(0, 20) + '...' : 'Not set'}`, 'dim');
  log(`  User ID: ${userId || 'Not set'}`, 'dim');
  log(`  User Email: ${userEmail || 'Not set'}`, 'dim');
  log(`  Product ID: ${productId || 'Not set'}`, 'dim');
  log(`  Cart ID: ${cartId || 'Not set'}`, 'dim');
  log(`  Order ID: ${orderId || 'Not set'}\n`, 'dim');
}

/**
 * Clear stored data
 */
function clearData() {
  authToken = '';
  userId = '';
  userEmail = '';
  productId = '';
  cartId = '';
  orderId = '';
  log('✓ Data cleared', 'green');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Direct command execution
  if (command) {
    switch (command.toLowerCase()) {
      case 'health':
        await testHealth();
        break;
      case 'status':
        await testStatus();
        break;
      case 'register':
        await testRegister();
        break;
      case 'login':
        await testLogin();
        break;
      case 'me':
        await testGetCurrentUser();
        break;
      case 'products':
        await testListProducts();
        break;
      case 'product':
        await testGetProduct();
        break;
      case 'categories':
        await testListCategories();
        break;
      case 'cart':
        await testGetCart();
        break;
      case 'add-to-cart':
        await testAddToCart();
        break;
      case 'orders':
        await testListOrders();
        break;
      case 'coupons':
        await testListCoupons();
        break;
      case 'validate-coupon':
        await testValidateCoupon();
        break;
      case 'reviews':
        await testGetReviews();
        break;
      case 'submit-review':
        await testSubmitReview();
        break;
      case 'all':
        await runAllTests();
        break;
      case 'clear':
        clearData();
        break;
      default:
        log(`Unknown command: ${command}`, 'red');
        await showMenu();
    }
    return;
  }

  // Interactive mode
  let running = true;
  while (running) {
    await showMenu();

    const answer = await new Promise<string>((resolve) => {
      process.stdout.write('Enter command (1-18): ');
      const input = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      input.once('line', (answer: string) => {
        input.close();
        resolve(answer.trim());
      });
    });

    switch (answer) {
      case '1':
        await testHealth();
        break;
      case '2':
        await testStatus();
        break;
      case '3':
        await testRegister();
        break;
      case '4':
        await testLogin();
        break;
      case '5':
        await testGetCurrentUser();
        break;
      case '6':
        await testListProducts();
        break;
      case '7':
        await testGetProduct();
        break;
      case '8':
        await testListCategories();
        break;
      case '9':
        await testGetCart();
        break;
      case '10':
        await testAddToCart();
        break;
      case '11':
        await testListOrders();
        break;
      case '12':
        await testListCoupons();
        break;
      case '13':
        await testValidateCoupon();
        break;
      case '14':
        await testGetReviews();
        break;
      case '15':
        await testSubmitReview();
        break;
      case '16':
        await runAllTests();
        break;
      case '17':
        clearData();
        break;
      case '18':
      case 'exit':
      case 'quit':
        log('\nGoodbye! 👋\n', 'green');
        running = false;
        break;
      default:
        log(`Invalid option: ${answer}`, 'red');
    }
  }
}

// Run main
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
