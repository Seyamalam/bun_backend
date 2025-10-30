#!/usr/bin/env bun
/**
 * Quick API Test Script
 * Fast way to test specific endpoints
 * 
 * Usage:
 *   bun quick-test.ts health
 *   bun quick-test.ts register user@example.com password123
 *   bun quick-test.ts login user@example.com password123
 *   bun quick-test.ts products
 */

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

const colors: Record<string, string> = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(msg: string, color = 'reset') {
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

async function fetch_request(
  method: string,
  url: string,
  body?: any,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const start = Date.now();
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    const data = await res.json();

    log(`\n[${method}] ${url} (${duration}ms)`, 'cyan');
    log(`Status: ${res.status}`, res.ok ? 'green' : 'red');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    log(`Error: ${err instanceof Error ? err.message : String(err)}`, 'red');
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) {
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║   E-Commerce Backend Quick Test       ║', 'blue');
    log('╚════════════════════════════════════════╝\n', 'blue');

    log('Usage Examples:\n', 'yellow');
    log('  bun quick-test.ts health');
    log('  bun quick-test.ts status');
    log('  bun quick-test.ts register john@example.com Password123!');
    log('  bun quick-test.ts login john@example.com Password123!');
    log('  bun quick-test.ts products');
    log('  bun quick-test.ts categories');
    log('  bun quick-test.ts coupons\n');
    return;
  }

  switch (cmd) {
    case 'health':
      await fetch_request('GET', `${BASE_URL}/health`);
      break;

    case 'status':
      await fetch_request('GET', `${API_URL}/status`);
      break;

    case 'register':
      if (args.length < 3) {
        log('Usage: bun quick-test.ts register <email> <password>', 'red');
        return;
      }
      await fetch_request('POST', `${API_URL}/auth/register`, {
        email: args[1],
        password: args[2],
        password_confirm: args[2],
        first_name: 'Test',
        last_name: 'User',
      });
      break;

    case 'login':
      if (args.length < 3) {
        log('Usage: bun quick-test.ts login <email> <password>', 'red');
        return;
      }
      await fetch_request('POST', `${API_URL}/auth/login`, {
        email: args[1],
        password: args[2],
      });
      break;

    case 'products':
      await fetch_request(
        'GET',
        `${API_URL}/products?page=1&limit=10`
      );
      break;

    case 'categories':
      await fetch_request('GET', `${API_URL}/categories`);
      break;

    case 'coupons':
      await fetch_request('GET', `${API_URL}/coupons`);
      break;

    default:
      log(`Unknown command: ${cmd}`, 'red');
      log('Run without arguments to see available commands', 'yellow');
  }
}

main().catch((err) => {
  log(`Fatal: ${err.message}`, 'red');
  process.exit(1);
});
