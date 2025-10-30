#!/usr/bin/env bun

/**
 * Performance Benchmark Script for E-Commerce API
 * Tests various endpoints and provides comprehensive metrics
 * 
 * Usage:
 *   bun benchmark.ts [options]
 * 
 * Options:
 *   --host <url>        API host URL (default: http://localhost:3000)
 *   --duration <sec>    Test duration in seconds (default: 30)
 *   --concurrency <n>   Number of concurrent requests (default: 50)
 *   --rps <n>           Target requests per second (default: unlimited)
 *   --warmup <sec>      Warmup duration in seconds (default: 5)
 */

interface BenchmarkResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  statusCodes: Record<number, number>;
}

interface TestScenario {
  name: string;
  method: string;
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  weight: number;
}

class PerformanceBenchmark {
  private host: string;
  private duration: number;
  private concurrency: number;
  private rps: number;
  private warmup: number;
  private responseTimes: number[] = [];
  private statusCodes: Record<number, number> = {};
  private successCount = 0;
  private failureCount = 0;
  private authToken: string | null = null;

  constructor(
    host: string = 'http://localhost:3000',
    duration: number = 30,
    concurrency: number = 50,
    rps: number = 0,
    warmup: number = 5
  ) {
    this.host = host;
    this.duration = duration;
    this.concurrency = concurrency;
    this.rps = rps;
    this.warmup = warmup;
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    headers?: Record<string, string>,
    body?: any
  ): Promise<{ status: number; time: number }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.host}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.responseTimes.push(responseTime);
      this.statusCodes[response.status] = (this.statusCodes[response.status] || 0) + 1;

      if (response.status >= 200 && response.status < 400) {
        this.successCount++;
      } else {
        this.failureCount++;
      }

      return { status: response.status, time: responseTime };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.responseTimes.push(responseTime);
      this.failureCount++;
      this.statusCodes[0] = (this.statusCodes[0] || 0) + 1;

      return { status: 0, time: responseTime };
    }
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private resetMetrics(): void {
    this.responseTimes = [];
    this.statusCodes = {};
    this.successCount = 0;
    this.failureCount = 0;
  }

  private async setupTestData(): Promise<void> {
    console.log('🔧 Setting up test data...');
    
    // Check health
    const health = await fetch(`${this.host}/health`);
    if (!health.ok) {
      throw new Error('API is not healthy. Please start the server first.');
    }
    console.log('✅ API is healthy');

    // Register a test user
    const registerResponse = await fetch(`${this.host}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `benchmark_${Date.now()}@test.com`,
        password: 'BenchmarkTest123!',
        full_name: 'Benchmark User',
      }),
    });

    if (registerResponse.ok) {
      const data = await registerResponse.json();
      this.authToken = data.data?.token || data.token;
      console.log('✅ Test user registered and authenticated');
    } else {
      // Try to login with existing user
      const loginResponse = await fetch(`${this.host}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Admin123!',
        }),
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        this.authToken = data.data?.token || data.token;
        console.log('✅ Authenticated with existing user');
      }
    }
  }

  private async runScenario(
    scenario: TestScenario,
    duration: number
  ): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    const delays: Promise<void>[] = [];

    // Calculate delay between requests if RPS is specified
    const delayMs = this.rps > 0 ? 1000 / this.rps : 0;

    while (Date.now() < endTime) {
      // Create batch of concurrent requests
      const batch = [];
      for (let i = 0; i < this.concurrency; i++) {
        const headers = { ...scenario.headers };
        if (this.authToken && !headers['Authorization']) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        batch.push(
          this.makeRequest(
            scenario.method,
            scenario.endpoint,
            headers,
            scenario.body
          )
        );
      }

      await Promise.all(batch);

      // Apply rate limit if specified
      if (delayMs > 0) {
        await Bun.sleep(delayMs * this.concurrency);
      }
    }
  }

  private async warmUp(): Promise<void> {
    if (this.warmup <= 0) return;

    console.log(`\n🔥 Warming up for ${this.warmup} seconds...`);
    const warmupScenario: TestScenario = {
      name: 'Warmup',
      method: 'GET',
      endpoint: '/health',
      weight: 1,
    };

    await this.runScenario(warmupScenario, this.warmup);
    this.resetMetrics();
    console.log('✅ Warmup complete\n');
  }

  async runBenchmark(scenario: TestScenario): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking: ${scenario.name}`);
    console.log(`   Method: ${scenario.method}`);
    console.log(`   Endpoint: ${scenario.endpoint}`);
    console.log(`   Duration: ${this.duration}s`);
    console.log(`   Concurrency: ${this.concurrency}`);
    if (this.rps > 0) {
      console.log(`   Target RPS: ${this.rps}`);
    }

    this.resetMetrics();

    const startTime = Date.now();
    await this.runScenario(scenario, this.duration);
    const endTime = Date.now();
    const actualDuration = (endTime - startTime) / 1000;

    const totalRequests = this.successCount + this.failureCount;
    const rps = totalRequests / actualDuration;

    return {
      endpoint: scenario.endpoint,
      method: scenario.method,
      totalRequests,
      successfulRequests: this.successCount,
      failedRequests: this.failureCount,
      duration: actualDuration,
      requestsPerSecond: rps,
      avgResponseTime:
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length,
      minResponseTime: Math.min(...this.responseTimes),
      maxResponseTime: Math.max(...this.responseTimes),
      p50ResponseTime: this.calculatePercentile(this.responseTimes, 50),
      p95ResponseTime: this.calculatePercentile(this.responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(this.responseTimes, 99),
      errorRate: (this.failureCount / totalRequests) * 100,
      statusCodes: { ...this.statusCodes },
    };
  }

  printResults(result: BenchmarkResult): void {
    console.log('\n' + '='.repeat(80));
    console.log(`📈 Results for ${result.method} ${result.endpoint}`);
    console.log('='.repeat(80));
    console.log(`Total Requests:       ${result.totalRequests.toLocaleString()}`);
    console.log(`Successful:           ${result.successfulRequests.toLocaleString()} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed:               ${result.failedRequests.toLocaleString()} (${result.errorRate.toFixed(2)}%)`);
    console.log(`Duration:             ${result.duration.toFixed(2)}s`);
    console.log(`\n⚡ Performance:`);
    console.log(`Requests/sec:         ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`Avg Response Time:    ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time:    ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time:    ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`\n📊 Percentiles:`);
    console.log(`P50 (Median):         ${result.p50ResponseTime.toFixed(2)}ms`);
    console.log(`P95:                  ${result.p95ResponseTime.toFixed(2)}ms`);
    console.log(`P99:                  ${result.p99ResponseTime.toFixed(2)}ms`);
    console.log(`\n📡 Status Codes:`);
    Object.entries(result.statusCodes)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([code, count]) => {
        console.log(`  ${code === '0' ? 'Network Error' : code}: ${count.toLocaleString()}`);
      });
    console.log('='.repeat(80) + '\n');
  }

  async run(): Promise<void> {
    console.log('\n' + '🚀 E-Commerce API Performance Benchmark '.padEnd(80, '='));
    console.log(`Host: ${this.host}`);
    console.log(`Duration: ${this.duration}s per scenario`);
    console.log(`Concurrency: ${this.concurrency}`);
    console.log(`Warmup: ${this.warmup}s`);
    console.log('='.repeat(80));

    try {
      await this.setupTestData();
      await this.warmUp();

      const scenarios: TestScenario[] = [
        {
          name: 'Health Check',
          method: 'GET',
          endpoint: '/health',
          weight: 10,
        },
        {
          name: 'API Status',
          method: 'GET',
          endpoint: '/api/v1/status',
          weight: 5,
        },
        {
          name: 'List Products',
          method: 'GET',
          endpoint: '/api/v1/products',
          weight: 20,
        },
        {
          name: 'Get Product Details',
          method: 'GET',
          endpoint: '/api/v1/products/1',
          weight: 15,
        },
        {
          name: 'List Categories',
          method: 'GET',
          endpoint: '/api/v1/categories',
          weight: 10,
        },
        {
          name: 'Get Cart',
          method: 'GET',
          endpoint: '/api/v1/cart',
          weight: 10,
        },
        {
          name: 'User Authentication (Current User)',
          method: 'GET',
          endpoint: '/api/v1/auth/me',
          weight: 15,
        },
        {
          name: 'Get Inventory',
          method: 'GET',
          endpoint: '/api/v1/inventory',
          weight: 5,
        },
      ];

      const allResults: BenchmarkResult[] = [];

      for (const scenario of scenarios) {
        const result = await this.runBenchmark(scenario);
        this.printResults(result);
        allResults.push(result);
      }

      // Print summary
      console.log('\n' + '📊 Overall Summary '.padEnd(80, '='));
      const totalRequests = allResults.reduce((sum, r) => sum + r.totalRequests, 0);
      const totalSuccessful = allResults.reduce((sum, r) => sum + r.successfulRequests, 0);
      const totalFailed = allResults.reduce((sum, r) => sum + r.failedRequests, 0);
      const avgRps = allResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / allResults.length;
      const avgResponseTime = allResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / allResults.length;

      console.log(`Total Requests:       ${totalRequests.toLocaleString()}`);
      console.log(`Successful:           ${totalSuccessful.toLocaleString()} (${((totalSuccessful / totalRequests) * 100).toFixed(2)}%)`);
      console.log(`Failed:               ${totalFailed.toLocaleString()} (${((totalFailed / totalRequests) * 100).toFixed(2)}%)`);
      console.log(`Avg RPS (per test):   ${avgRps.toFixed(2)}`);
      console.log(`Avg Response Time:    ${avgResponseTime.toFixed(2)}ms`);
      console.log('='.repeat(80) + '\n');

      // Export results to JSON
      const resultsFile = `benchmark-results-${Date.now()}.json`;
      await Bun.write(
        resultsFile,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            config: {
              host: this.host,
              duration: this.duration,
              concurrency: this.concurrency,
              rps: this.rps,
              warmup: this.warmup,
            },
            results: allResults,
            summary: {
              totalRequests,
              totalSuccessful,
              totalFailed,
              avgRps,
              avgResponseTime,
            },
          },
          null,
          2
        )
      );

      console.log(`✅ Results exported to: ${resultsFile}\n`);
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): {
  host: string;
  duration: number;
  concurrency: number;
  rps: number;
  warmup: number;
} {
  const args = process.argv.slice(2);
  const config = {
    host: 'http://localhost:3000',
    duration: 30,
    concurrency: 50,
    rps: 0,
    warmup: 5,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--host':
        config.host = value || config.host;
        break;
      case '--duration':
        config.duration = parseInt(value || '30', 10);
        break;
      case '--concurrency':
        config.concurrency = parseInt(value || '50', 10);
        break;
      case '--rps':
        config.rps = parseInt(value || '0', 10);
        break;
      case '--warmup':
        config.warmup = parseInt(value || '5', 10);
        break;
      case '--help':
        console.log(`
E-Commerce API Performance Benchmark

Usage: bun benchmark.ts [options]

Options:
  --host <url>        API host URL (default: http://localhost:3000)
  --duration <sec>    Test duration in seconds per scenario (default: 30)
  --concurrency <n>   Number of concurrent requests (default: 50)
  --rps <n>           Target requests per second, 0 for unlimited (default: 0)
  --warmup <sec>      Warmup duration in seconds (default: 5)
  --help              Show this help message

Examples:
  bun benchmark.ts
  bun benchmark.ts --duration 60 --concurrency 100
  bun benchmark.ts --host http://api.example.com --rps 1000
        `);
        process.exit(0);
    }
  }

  return config;
}

// Main execution
const config = parseArgs();
const benchmark = new PerformanceBenchmark(
  config.host,
  config.duration,
  config.concurrency,
  config.rps,
  config.warmup
);

benchmark.run();
