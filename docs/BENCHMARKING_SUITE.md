# 🎯 Complete Benchmarking Suite

This document provides a complete overview of the benchmarking and performance testing tools available for the E-Commerce API.

## 📦 What's Included

### Docker Deployment
- **Dockerfile** - Minimal Alpine Linux image with Bun (~90MB)
- **docker-compose.yml** - Complete orchestration with volume persistence
- **No OS bloat** - Uses `oven/bun:1-alpine` base image

### Benchmarking Scripts

| Script | Purpose | Best For |
|--------|---------|----------|
| `benchmark.ts` | Comprehensive multi-endpoint testing | General performance testing |
| `stress-test.ts` | Gradual load increase to find limits | Finding breaking points |
| `load-test-scenarios.ts` | Real-world user behavior simulation | Production readiness |
| `benchmark.sh` | Shell-based with external tools | CI/CD integration |
| `run-benchmark.sh` | Interactive menu | First-time users |
| `quick-benchmark.sh` | One-command Docker + benchmark | Quick testing |

### Documentation
- **BENCHMARK_README.md** - Comprehensive benchmarking guide
- **DOCKER_QUICKSTART.md** - Quick start for Docker deployment
- **This file** - Overview and comparison

---

## 🚀 Quick Start

### Absolute Fastest Way (1 command)
```bash
./quick-benchmark.sh
```
This starts Docker and runs a 30-second benchmark automatically.

### Interactive Way
```bash
./run-benchmark.sh
```
Menu-driven interface to choose your test type.

### Manual Way
```bash
# 1. Start API
docker-compose up -d

# 2. Run benchmark
bun benchmark.ts --duration 60 --concurrency 100
```

---

## 📊 Script Comparison

### benchmark.ts (Recommended)

**Pros:**
- ✅ Tests multiple endpoints automatically
- ✅ Detailed metrics (RPS, percentiles, status codes)
- ✅ JSON export for tracking over time
- ✅ Automatic test user setup
- ✅ Configurable warmup period
- ✅ Rate limiting support

**Cons:**
- ❌ Requires Bun runtime

**Usage:**
```bash
bun benchmark.ts [options]
  --host <url>          API host (default: http://localhost:3000)
  --duration <sec>      Test duration per scenario (default: 30)
  --concurrency <n>     Concurrent requests (default: 50)
  --rps <n>            Target RPS, 0=unlimited (default: 0)
  --warmup <sec>       Warmup duration (default: 5)
```

**Output:**
- Console: Detailed metrics per endpoint + summary
- File: `benchmark-results-<timestamp>.json`

**Best for:**
- Regular performance testing
- Comparing changes over time
- Detailed analysis

---

### stress-test.ts

**Pros:**
- ✅ Automatically finds performance limits
- ✅ Identifies optimal concurrency settings
- ✅ Gradual load increase
- ✅ Recommendations included

**Cons:**
- ❌ Takes longer to run
- ❌ Tests only one endpoint (products)

**Usage:**
```bash
bun stress-test.ts [host]
```

**Output:**
- Console: Peak performance and recommendations
- File: `stress-test-results-<timestamp>.json`

**Best for:**
- Capacity planning
- Finding breaking points
- Optimization targets

---

### load-test-scenarios.ts

**Pros:**
- ✅ Realistic user behavior (browse, cart, checkout)
- ✅ Simulates actual production load
- ✅ Tests full user journey
- ✅ Multiple concurrent users

**Cons:**
- ❌ Slower (includes think time)
- ❌ More complex to interpret

**Usage:**
```bash
bun load-test-scenarios.ts [host] [duration] [users]

# Example: 60 seconds with 20 users
bun load-test-scenarios.ts http://localhost:3000 60 20
```

**User Behavior:**
- 70% Browse products
- 15% Add to cart
- 10% Checkout
- 5% Account operations

**Output:**
- Console: Overall metrics
- File: `load-test-results-<timestamp>.json`

**Best for:**
- Production readiness testing
- Realistic load simulation
- End-to-end testing

---

### benchmark.sh

**Pros:**
- ✅ Uses standard tools (hey/ab/wrk)
- ✅ Simple and portable
- ✅ Good for CI/CD
- ✅ Works without Bun

**Cons:**
- ❌ Requires external tools
- ❌ Less detailed metrics
- ❌ Manual endpoint selection

**Usage:**
```bash
./benchmark.sh [host] [duration] [concurrency]

# Example
./benchmark.sh http://localhost:3000 30 50
```

**Output:**
- Console: Per-endpoint results
- Directory: `benchmark-results-<timestamp>/`

**Best for:**
- CI/CD pipelines
- Standard tool compatibility
- Simple testing

---

### run-benchmark.sh

**Pros:**
- ✅ Interactive menu
- ✅ Starts Docker automatically
- ✅ Easy for beginners
- ✅ Validates API health

**Cons:**
- ❌ Interactive (not good for automation)

**Usage:**
```bash
./run-benchmark.sh
```

**Output:**
- Depends on selected option

**Best for:**
- First-time users
- Quick testing
- Choosing the right tool

---

### quick-benchmark.sh

**Pros:**
- ✅ One command to start everything
- ✅ Automatic Docker startup
- ✅ Health checks included

**Cons:**
- ❌ Fixed parameters (30s, 50 concurrent)

**Usage:**
```bash
./quick-benchmark.sh [duration] [concurrency]
```

**Output:**
- Delegates to `benchmark.ts`

**Best for:**
- Quick validation
- Smoke testing
- After making changes

---

## 🎯 Use Case Guide

### "I just want to test if it works"
```bash
./quick-benchmark.sh
```

### "I want to know the exact performance"
```bash
bun benchmark.ts --duration 60 --concurrency 100
```

### "I need to find the maximum capacity"
```bash
bun stress-test.ts
```

### "I want realistic production simulation"
```bash
bun load-test-scenarios.ts http://localhost:3000 300 50
```

### "I need to integrate with CI/CD"
```bash
./benchmark.sh http://localhost:3000 30 50
```

### "I'm not sure what to use"
```bash
./run-benchmark.sh
```

---

## 📈 Interpreting Results

### Good Performance Indicators
- ✅ RPS > 1000
- ✅ Avg Response Time < 100ms
- ✅ P95 < 200ms
- ✅ P99 < 500ms
- ✅ Error Rate < 1%

### Warning Signs
- ⚠️ RPS < 100
- ⚠️ Avg Response Time > 500ms
- ⚠️ P95 > 1000ms
- ⚠️ Error Rate > 5%
- ⚠️ RPS decreases with load

### Critical Issues
- 🚨 Error Rate > 10%
- 🚨 P99 > 5000ms
- 🚨 Connection timeouts
- 🚨 Server crashes

---

## 🔧 Optimization Tips

### Based on Benchmark Results

**Low RPS?**
1. Enable database indexes
2. Add caching layer
3. Optimize hot paths
4. Profile with `bun --profile`

**High Response Times?**
1. Optimize database queries
2. Add connection pooling
3. Enable WAL mode (already enabled)
4. Use faster disk (SSD)

**High Error Rate?**
1. Check logs: `docker-compose logs`
2. Increase rate limits
3. Fix application bugs
4. Add more resources

**Memory Issues?**
1. Check for memory leaks
2. Optimize data structures
3. Add limits in Docker
4. Use streaming for large responses

---

## 🐳 Docker Performance

### Resource Configuration

Edit `docker-compose.yml`:

```yaml
services:
  ecommerce-api:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 1G
```

### Scaling Horizontally

```bash
# Run 5 instances
docker-compose up --scale ecommerce-api=5 -d
```

Note: You'll need a load balancer (nginx/traefik) for this.

---

## 📊 Tracking Performance Over Time

### Save Baseline
```bash
bun benchmark.ts > baseline.txt
cp benchmark-results-*.json baseline.json
```

### Compare After Changes
```bash
bun benchmark.ts > after-changes.txt
diff baseline.txt after-changes.txt
```

### Automated Tracking
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
bun benchmark.ts
mv benchmark-results-*.json "benchmark-${DATE}.json"
```

---

## 🎓 Advanced Scenarios

### Testing with Rate Limiting
```bash
# Test at 1000 RPS limit
bun benchmark.ts --rps 1000 --duration 60
```

### Long-Duration Test
```bash
# 10 minute sustained load
bun benchmark.ts --duration 600 --concurrency 200
```

### Spike Test
```bash
# Sudden load increase
bun benchmark.ts --concurrency 500 --duration 30 --warmup 0
```

### Soak Test
```bash
# Extended duration to find memory leaks
bun load-test-scenarios.ts http://localhost:3000 3600 20
```

---

## 📚 Additional Resources

- [BENCHMARK_README.md](./BENCHMARK_README.md) - Detailed guide
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Docker guide
- [README.md](./README.md) - API documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

---

## 🤝 Contributing

Found an issue or have a suggestion? Create an issue or PR!

---

**Happy Benchmarking! 🚀**
