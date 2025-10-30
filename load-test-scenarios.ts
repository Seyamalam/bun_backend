#!/usr/bin/env bun

/**
 * Load Test with Real-World Scenarios
 * 
 * Simulates realistic user behavior patterns:
 * - Browse products (70%)
 * - Add to cart (15%)
 * - Checkout (10%)
 * - User account operations (5%)
 * 
 * Usage: bun load-test-scenarios.ts [duration] [users]
 */

interface User {
  id: number;
  token?: string;
  cart: any[];
}

interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  errors: Map<string, number>;
}

class LoadTestScenario {
  private host: string;
  private duration: number;
  private concurrentUsers: number;
  private users: User[] = [];
  private metrics: Metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    errors: new Map(),
  };

  constructor(
    host: string = 'http://localhost:3000',
    duration: number = 60,
    concurrentUsers: number = 10
  ) {
    this.host = host;
    this.duration = duration;
    this.concurrentUsers = concurrentUsers;
  }

  private async registerUser(userId: number): Promise<User> {
    const user: User = { id: userId, cart: [] };
    
    try {
      const response = await fetch(`${this.host}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `loadtest_user_${userId}_${Date.now()}@test.com`,
          password: 'LoadTest123!',
          full_name: `Load Test User ${userId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        user.token = data.data?.token || data.token;
      }
    } catch (error) {
      // Silently fail, user will continue without token
    }

    return user;
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    user?: User,
    body?: any
  ): Promise<{ success: boolean; data?: any }> {
    const startTime = performance.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${this.host}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = performance.now();
      this.metrics.responseTimes.push(endTime - startTime);
      this.metrics.totalRequests++;

      if (response.ok) {
        this.metrics.successfulRequests++;
        const data = await response.json();
        return { success: true, data };
      } else {
        this.metrics.failedRequests++;
        const errorKey = `${response.status}: ${endpoint}`;
        this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);
        return { success: false };
      }
    } catch (error) {
      const endTime = performance.now();
      this.metrics.responseTimes.push(endTime - startTime);
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;
      
      const errorKey = `Network Error: ${endpoint}`;
      this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);
      
      return { success: false };
    }
  }

  private async browseProducts(user: User): Promise<void> {
    // List products
    await this.makeRequest('GET', '/api/v1/products', user);
    
    // Random product detail view
    const productId = Math.floor(Math.random() * 10) + 1;
    await this.makeRequest('GET', `/api/v1/products/${productId}`, user);
    
    // Browse categories
    await this.makeRequest('GET', '/api/v1/categories', user);
  }

  private async addToCart(user: User): Promise<void> {
    if (!user.token) return;
    
    const productId = Math.floor(Math.random() * 10) + 1;
    const quantity = Math.floor(Math.random() * 3) + 1;
    
    const result = await this.makeRequest(
      'POST',
      '/api/v1/cart/items',
      user,
      {
        product_id: productId.toString(),
        quantity,
      }
    );
    
    if (result.success) {
      user.cart.push({ product_id: productId, quantity });
    }
  }

  private async checkout(user: User): Promise<void> {
    if (!user.token || user.cart.length === 0) return;
    
    // View cart
    await this.makeRequest('GET', '/api/v1/cart', user);
    
    // Create order
    await this.makeRequest(
      'POST',
      '/api/v1/orders',
      user,
      {
        payment_method: 'credit_card',
      }
    );
    
    // Clear local cart tracking
    user.cart = [];
  }

  private async userAccountOperations(user: User): Promise<void> {
    if (!user.token) return;
    
    // Get current user
    await this.makeRequest('GET', '/api/v1/auth/me', user);
    
    // Get orders
    await this.makeRequest('GET', '/api/v1/orders', user);
  }

  private async simulateUserBehavior(user: User): Promise<void> {
    const endTime = Date.now() + this.duration * 1000;
    
    while (Date.now() < endTime) {
      // Random action based on realistic weights
      const action = Math.random() * 100;
      
      if (action < 70) {
        // 70% - Browse products
        await this.browseProducts(user);
      } else if (action < 85) {
        // 15% - Add to cart
        await this.addToCart(user);
      } else if (action < 95) {
        // 10% - Checkout
        await this.checkout(user);
      } else {
        // 5% - User account operations
        await this.userAccountOperations(user);
      }
      
      // Random think time between 1-5 seconds
      const thinkTime = Math.random() * 4000 + 1000;
      await Bun.sleep(thinkTime);
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private printMetrics(): void {
    const duration = this.duration;
    const totalRequests = this.metrics.totalRequests;
    const successfulRequests = this.metrics.successfulRequests;
    const failedRequests = this.metrics.failedRequests;
    const responseTimes = this.metrics.responseTimes;

    console.log('\n' + '='.repeat(80));
    console.log('📊 Load Test Results');
    console.log('='.repeat(80));
    console.log(`\n📈 Overall Statistics:`);
    console.log(`Duration:             ${duration}s`);
    console.log(`Concurrent Users:     ${this.concurrentUsers}`);
    console.log(`Total Requests:       ${totalRequests.toLocaleString()}`);
    console.log(`Successful:           ${successfulRequests.toLocaleString()} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed:               ${failedRequests.toLocaleString()} (${((failedRequests / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Requests/sec:         ${(totalRequests / duration).toFixed(2)}`);

    console.log(`\n⏱️  Response Times:`);
    console.log(`Average:              ${(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)}ms`);
    console.log(`Min:                  ${Math.min(...responseTimes).toFixed(2)}ms`);
    console.log(`Max:                  ${Math.max(...responseTimes).toFixed(2)}ms`);
    console.log(`P50 (Median):         ${this.calculatePercentile(responseTimes, 50).toFixed(2)}ms`);
    console.log(`P95:                  ${this.calculatePercentile(responseTimes, 95).toFixed(2)}ms`);
    console.log(`P99:                  ${this.calculatePercentile(responseTimes, 99).toFixed(2)}ms`);

    if (this.metrics.errors.size > 0) {
      console.log(`\n❌ Errors:`);
      Array.from(this.metrics.errors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([error, count]) => {
          console.log(`  ${error}: ${count.toLocaleString()}`);
        });
    }

    console.log('='.repeat(80) + '\n');
  }

  async run(): Promise<void> {
    console.log('🚀 E-Commerce Load Test with Real-World Scenarios');
    console.log('='.repeat(80));
    console.log(`Host:              ${this.host}`);
    console.log(`Duration:          ${this.duration}s`);
    console.log(`Concurrent Users:  ${this.concurrentUsers}`);
    console.log('='.repeat(80) + '\n');

    // Check health
    console.log('🔍 Checking API health...');
    try {
      const health = await fetch(`${this.host}/health`);
      if (!health.ok) {
        throw new Error('API is not healthy');
      }
      console.log('✅ API is healthy\n');
    } catch (error) {
      console.error('❌ API is not responding. Please start the server first.');
      process.exit(1);
    }

    // Register users
    console.log(`👥 Registering ${this.concurrentUsers} test users...`);
    for (let i = 0; i < this.concurrentUsers; i++) {
      const user = await this.registerUser(i + 1);
      this.users.push(user);
      process.stdout.write(`\r   Progress: ${i + 1}/${this.concurrentUsers}`);
    }
    console.log('\n✅ Users registered\n');

    // Run load test
    console.log('🔥 Starting load test...');
    console.log('   User behavior: 70% browse, 15% add to cart, 10% checkout, 5% account ops\n');
    
    const startTime = Date.now();
    const userPromises = this.users.map(user => this.simulateUserBehavior(user));
    
    // Progress indicator
    const progressInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const remaining = Math.max(0, this.duration - parseInt(elapsed));
      process.stdout.write(
        `\r   Running... ${elapsed}s elapsed, ${remaining}s remaining | ` +
        `${this.metrics.totalRequests} requests | ` +
        `${this.metrics.successfulRequests} success | ` +
        `${this.metrics.failedRequests} failed`
      );
    }, 1000);

    await Promise.all(userPromises);
    clearInterval(progressInterval);
    
    console.log('\n\n✅ Load test complete!\n');

    // Print results
    this.printMetrics();

    // Export results
    const filename = `load-test-results-${Date.now()}.json`;
    await Bun.write(
      filename,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          config: {
            host: this.host,
            duration: this.duration,
            concurrentUsers: this.concurrentUsers,
          },
          metrics: {
            totalRequests: this.metrics.totalRequests,
            successfulRequests: this.metrics.successfulRequests,
            failedRequests: this.metrics.failedRequests,
            requestsPerSecond: this.metrics.totalRequests / this.duration,
            avgResponseTime:
              this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
              this.metrics.responseTimes.length,
            p50: this.calculatePercentile(this.metrics.responseTimes, 50),
            p95: this.calculatePercentile(this.metrics.responseTimes, 95),
            p99: this.calculatePercentile(this.metrics.responseTimes, 99),
          },
          errors: Array.from(this.metrics.errors.entries()),
        },
        null,
        2
      )
    );

    console.log(`✅ Results exported to: ${filename}\n`);
  }
}

// Parse arguments
const host = process.argv[2] || 'http://localhost:3000';
const duration = parseInt(process.argv[3] || '60', 10);
const users = parseInt(process.argv[4] || '10', 10);

// Run load test
const loadTest = new LoadTestScenario(host, duration, users);
loadTest.run();
