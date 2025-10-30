# 🐳 Docker Quick Start Guide

Get the E-Commerce API up and running in seconds with Docker!

## ⚡ Quick Start (3 Steps)

### 1. Start the API
```bash
docker-compose up -d
```

### 2. Verify it's running
```bash
curl http://localhost:3000/health
```

### 3. Run a quick benchmark
```bash
bun benchmark.ts --duration 30 --concurrency 50
```

That's it! 🎉

---

## 📋 Available Commands

### Docker Commands

```bash
# Start API
docker-compose up -d

# View logs
docker-compose logs -f ecommerce-api

# Stop API
docker-compose down

# Restart API
docker-compose restart

# Rebuild and start
docker-compose up --build -d

# Stop and remove all data (reset database)
docker-compose down -v

# Check status
docker-compose ps
```

### NPM/Bun Scripts

```bash
# Docker operations
bun run docker:up          # Start with Docker
bun run docker:down        # Stop Docker containers
bun run docker:logs        # View logs
bun run docker:build       # Rebuild and start

# Benchmarking
bun run benchmark          # Full benchmark (60s)
bun run benchmark:quick    # Quick benchmark (30s)
bun run benchmark:stress   # Stress test
bun run benchmark:load     # Real-world load test
bun run benchmark:interactive  # Interactive menu
```

---

## 🧪 Benchmark Options

### 1. Interactive Menu (Easiest)
```bash
./run-benchmark.sh
```
This gives you a menu to choose from:
- Quick Benchmark
- Comprehensive Benchmark
- Stress Test
- Load Test with Real Scenarios
- Shell-based Benchmark
- Custom Benchmark

### 2. Quick Benchmark
```bash
bun benchmark.ts --duration 30 --concurrency 50
```
Perfect for first-time testing.

### 3. Comprehensive Benchmark
```bash
bun benchmark.ts --duration 60 --concurrency 100
```
Tests all endpoints with custom settings.

### 4. Stress Test
```bash
bun stress-test.ts
```
Gradually increases load to find your limits.

### 5. Real-World Load Test
```bash
bun load-test-scenarios.ts http://localhost:3000 60 10
```
Simulates actual user behavior (browsing, cart, checkout).

### 6. Shell-based Benchmark
```bash
./benchmark.sh http://localhost:3000 30 50
```
Uses standard tools like `hey`, `ab`, or `wrk`.

---

## 📊 Understanding Results

### Key Metrics

**Requests Per Second (RPS)**
- How many requests the server handles per second
- Higher is better
- Good: > 1000 RPS
- Excellent: > 5000 RPS

**Response Time**
- How long each request takes
- Lower is better
- Good: < 100ms average
- Excellent: < 50ms average

**P95/P99 Percentiles**
- P95: 95% of requests are faster than this
- P99: 99% of requests are faster than this
- Important for understanding worst-case scenarios

**Error Rate**
- Percentage of failed requests
- Should be 0% or very close
- > 1% indicates issues

### Example Output

```
📈 Results for GET /api/v1/products
================================================================================
Total Requests:       150,000
Successful:           150,000 (100.00%)
Failed:               0 (0.00%)
Duration:             30.05s

⚡ Performance:
Requests/sec:         4,991.68
Avg Response Time:    10.02ms
Min Response Time:    2.15ms
Max Response Time:    85.32ms

📊 Percentiles:
P50 (Median):         8.45ms
P95:                  18.32ms
P99:                  32.18ms
```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - JWT_SECRET=your-secret-here
  - ENABLE_RATE_LIMIT=true
```

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 512M
```

### Scaling

Run multiple instances:

```bash
docker-compose up --scale ecommerce-api=3 -d
```

---

## 🐛 Troubleshooting

### API won't start

**Check logs:**
```bash
docker-compose logs ecommerce-api
```

**Common issues:**
- Port 3000 already in use → Change port in `docker-compose.yml`
- Database locked → Stop all containers: `docker-compose down -v`
- Build failed → Clean build: `docker-compose build --no-cache`

### Low performance

**Solutions:**
1. Disable rate limiting for testing:
   ```yaml
   - ENABLE_RATE_LIMIT=false
   ```

2. Increase Docker resources (Docker Desktop → Settings → Resources)

3. Use Linux for best performance (Docker on Mac/Windows has overhead)

### Benchmark fails

**Check API is running:**
```bash
curl http://localhost:3000/health
```

**Reduce load:**
```bash
bun benchmark.ts --duration 10 --concurrency 10
```

---

## 💡 Pro Tips

### 1. Compare Performance

Run before and after changes:
```bash
# Before changes
bun benchmark.ts > before.txt

# Make changes
# ...

# After changes
bun benchmark.ts > after.txt

# Compare
diff before.txt after.txt
```

### 2. Test Different Endpoints

Modify `benchmark.ts` to focus on specific endpoints.

### 3. Monitor System Resources

```bash
# Terminal 1: Start API
docker-compose up

# Terminal 2: Monitor resources
docker stats

# Terminal 3: Run benchmark
bun benchmark.ts
```

### 4. Export Results

All benchmarks create JSON files:
- `benchmark-results-<timestamp>.json`
- `stress-test-results-<timestamp>.json`
- `load-test-results-<timestamp>.json`

Use these for tracking performance over time.

---

## 📚 Advanced Usage

### Custom Docker Build

```bash
# Build only
docker-compose build

# Build with no cache
docker-compose build --no-cache

# Build specific service
docker-compose build ecommerce-api
```

### Network Configuration

```bash
# View networks
docker network ls

# Inspect network
docker network inspect <network-name>
```

### Database Access

```bash
# Access database inside container
docker-compose exec ecommerce-api bun
# Then in Bun REPL:
# const db = require('./src/database/index.ts').getDatabase()
```

---

## 🎯 Recommended Workflow

### For Development
1. Start API: `docker-compose up`
2. Make changes
3. Restart: `docker-compose restart`
4. Quick test: `bun run benchmark:quick`

### For Testing
1. Start fresh: `docker-compose down -v && docker-compose up -d`
2. Full benchmark: `bun run benchmark`
3. Stress test: `bun run benchmark:stress`
4. Load test: `bun run benchmark:load`

### For Production
1. Build: `docker-compose build`
2. Deploy: `docker-compose up -d`
3. Monitor: `docker-compose logs -f`
4. Benchmark: `./run-benchmark.sh` (choose option 1 or 2)

---

## 🚀 Next Steps

- Read [BENCHMARK_README.md](./BENCHMARK_README.md) for detailed benchmarking guide
- Check [README.md](./README.md) for API documentation
- Explore [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

---

**Need help?** Create an issue on GitHub!
