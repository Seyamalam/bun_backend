#!/usr/bin/env bun

/**
 * Stress Test Script - Push the API to its limits
 * 
 * This script gradually increases load to find the breaking point
 * 
 * Usage: bun stress-test.ts [host]
 */

interface StressTestResult {
  concurrency: number;
  rps: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  successRate: number;
}

class StressTest {
  private host: string;
  private currentConcurrency: number = 10;
  private maxConcurrency: number = 1000;
  private stepSize: number = 10;
  private testDuration: number = 10; // seconds per test
  private results: StressTestResult[] = [];

  constructor(host: string = 'http://localhost:3000') {
    this.host = host;
  }

  private async runLoadTest(concurrency: number): Promise<StressTestResult | null> {
    const responseTimes: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    console.log(`\n🔬 Testing with ${concurrency} concurrent requests...`);
    
    const startTime = Date.now();
    const endTime = startTime + this.testDuration * 1000;
    
    while (Date.now() < endTime) {
      const batch = [];
      
      for (let i = 0; i < concurrency; i++) {
        const reqStart = performance.now();
        batch.push(
          fetch(`${this.host}/api/v1/products`)
            .then(response => {
              const reqEnd = performance.now();
              responseTimes.push(reqEnd - reqStart);
              
              if (response.ok) {
                successCount++;
              } else {
                failureCount++;
              }
            })
            .catch(() => {
              const reqEnd = performance.now();
              responseTimes.push(reqEnd - reqStart);
              failureCount++;
            })
        );
      }
      
      await Promise.all(batch);
    }
    
    const actualDuration = (Date.now() - startTime) / 1000;
    const totalRequests = successCount + failureCount;
    
    if (totalRequests === 0) return null;
    
    // Calculate percentiles
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * sorted.length);
    const p99Index = Math.floor(0.99 * sorted.length);
    
    const result: StressTestResult = {
      concurrency,
      rps: totalRequests / actualDuration,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
      errorRate: (failureCount / totalRequests) * 100,
      successRate: (successCount / totalRequests) * 100,
    };
    
    return result;
  }

  private printResult(result: StressTestResult): void {
    const status = result.errorRate < 1 ? '✅' : result.errorRate < 5 ? '⚠️' : '❌';
    console.log(`${status} Concurrency: ${result.concurrency}`);
    console.log(`   RPS: ${result.rps.toFixed(2)}`);
    console.log(`   Avg Response: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   P95: ${result.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   P99: ${result.p99ResponseTime.toFixed(2)}ms`);
    console.log(`   Success Rate: ${result.successRate.toFixed(2)}%`);
    console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`);
  }

  async run(): Promise<void> {
    console.log('🚀 E-Commerce API Stress Test');
    console.log('===============================');
    console.log(`Host: ${this.host}`);
    console.log(`Test Duration: ${this.testDuration}s per level`);
    console.log(`Max Concurrency: ${this.maxConcurrency}`);
    console.log('===============================\n');
    
    // Check health
    console.log('🔍 Checking API health...');
    const health = await fetch(`${this.host}/health`);
    if (!health.ok) {
      console.error('❌ API is not healthy. Please start the server first.');
      process.exit(1);
    }
    console.log('✅ API is healthy\n');
    
    // Warmup
    console.log('🔥 Warming up...');
    await this.runLoadTest(5);
    console.log('✅ Warmup complete\n');
    
    // Gradual stress test
    console.log('📈 Starting gradual load increase...\n');
    
    let previousRps = 0;
    let rpsDecreaseCount = 0;
    
    while (this.currentConcurrency <= this.maxConcurrency) {
      const result = await this.runLoadTest(this.currentConcurrency);
      
      if (!result) {
        console.log('❌ Test failed, stopping...');
        break;
      }
      
      this.printResult(result);
      this.results.push(result);
      
      // Check for performance degradation
      if (result.errorRate > 10) {
        console.log('\n⚠️  Error rate exceeded 10%. System is at its limit.');
        break;
      }
      
      if (result.p99ResponseTime > 5000) {
        console.log('\n⚠️  P99 response time exceeded 5 seconds. System is overloaded.');
        break;
      }
      
      // Check if RPS is decreasing (sign of saturation)
      if (previousRps > 0 && result.rps < previousRps * 0.95) {
        rpsDecreaseCount++;
        if (rpsDecreaseCount >= 2) {
          console.log('\n⚠️  RPS is decreasing. System has reached peak performance.');
          break;
        }
      } else {
        rpsDecreaseCount = 0;
      }
      
      previousRps = result.rps;
      
      // Increase load
      this.currentConcurrency += this.stepSize;
      
      // Wait a bit between tests
      await Bun.sleep(2000);
    }
    
    // Print summary
    this.printSummary();
    
    // Export results
    await this.exportResults();
  }

  private printSummary(): void {
    if (this.results.length === 0) return;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Stress Test Summary');
    console.log('='.repeat(80));
    
    // Find peak performance
    const peakRps = Math.max(...this.results.map(r => r.rps));
    const peakResult = this.results.find(r => r.rps === peakRps);
    
    if (peakResult) {
      console.log('\n🏆 Peak Performance:');
      console.log(`   Concurrency: ${peakResult.concurrency}`);
      console.log(`   Max RPS: ${peakResult.rps.toFixed(2)}`);
      console.log(`   Avg Response Time: ${peakResult.avgResponseTime.toFixed(2)}ms`);
      console.log(`   P95 Response Time: ${peakResult.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${peakResult.p99ResponseTime.toFixed(2)}ms`);
      console.log(`   Error Rate: ${peakResult.errorRate.toFixed(2)}%`);
    }
    
    // Find optimal concurrency (best RPS with low error rate)
    const optimalResult = [...this.results]
      .filter(r => r.errorRate < 1)
      .sort((a, b) => b.rps - a.rps)[0];
    
    if (optimalResult) {
      console.log('\n🎯 Recommended Optimal Settings:');
      console.log(`   Concurrency: ${optimalResult.concurrency}`);
      console.log(`   Expected RPS: ${optimalResult.rps.toFixed(2)}`);
      console.log(`   Avg Response Time: ${optimalResult.avgResponseTime.toFixed(2)}ms`);
      console.log(`   P95 Response Time: ${optimalResult.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   Error Rate: ${optimalResult.errorRate.toFixed(2)}%`);
    }
    
    // Performance characteristics
    console.log('\n📈 Performance Characteristics:');
    const startRps = this.results[0]?.rps || 0;
    const endRps = this.results[this.results.length - 1]?.rps || 0;
    const rpsGrowth = ((endRps - startRps) / startRps) * 100;
    
    console.log(`   Starting RPS: ${startRps.toFixed(2)}`);
    console.log(`   Ending RPS: ${endRps.toFixed(2)}`);
    console.log(`   RPS Growth: ${rpsGrowth.toFixed(2)}%`);
    
    const avgErrorRate = this.results.reduce((sum, r) => sum + r.errorRate, 0) / this.results.length;
    console.log(`   Avg Error Rate: ${avgErrorRate.toFixed(2)}%`);
    
    console.log('\n💡 Recommendations:');
    if (avgErrorRate > 5) {
      console.log('   ⚠️  High error rate detected. Consider:');
      console.log('      - Increasing server resources');
      console.log('      - Optimizing database queries');
      console.log('      - Adding caching layer');
    }
    
    if (optimalResult && optimalResult.p95ResponseTime > 200) {
      console.log('   ⚠️  High response times. Consider:');
      console.log('      - Adding database indexes');
      console.log('      - Enabling connection pooling');
      console.log('      - Using a faster database');
    }
    
    if (optimalResult && optimalResult.rps < 100) {
      console.log('   ⚠️  Low throughput. Consider:');
      console.log('      - Profiling application code');
      console.log('      - Optimizing hot paths');
      console.log('      - Scaling horizontally');
    }
    
    console.log('='.repeat(80) + '\n');
  }

  private async exportResults(): Promise<void> {
    const filename = `stress-test-results-${Date.now()}.json`;
    await Bun.write(
      filename,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          config: {
            host: this.host,
            testDuration: this.testDuration,
            maxConcurrency: this.maxConcurrency,
            stepSize: this.stepSize,
          },
          results: this.results,
          summary: {
            peakRps: Math.max(...this.results.map(r => r.rps)),
            optimalConcurrency: [...this.results]
              .filter(r => r.errorRate < 1)
              .sort((a, b) => b.rps - a.rps)[0]?.concurrency || 0,
          },
        },
        null,
        2
      )
    );
    
    console.log(`✅ Results exported to: ${filename}\n`);
  }
}

// Main execution
const host = process.argv[2] || 'http://localhost:3000';
const stressTest = new StressTest(host);
stressTest.run();
