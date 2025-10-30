# 🚀 E-Commerce API Benchmarking & Docker Deployment

This guide covers deploying the e-commerce API with Docker and running comprehensive performance benchmarks.

## 📦 Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1. **Build and start the application:**
```bash
docker-compose up --build -d
```

2. **Check the status:**
```bash
docker-compose ps
docker-compose logs -f ecommerce-api
```

3. **Access the API:**
```bash
curl http://localhost:3000/health
```

4. **Stop the application:**
```bash
docker-compose down
```

5. **Stop and remove volumes (reset database):**
```bash
docker-compose down -v
```

### Docker Image Details

- **Base Image:** `oven/bun:1-alpine` (minimal Alpine Linux with Bun runtime)
- **Image Size:** ~90MB (extremely lightweight)
- **Architecture:** Multi-arch support (amd64, arm64)

### Configuration

Environment variables can be customized in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_URL=/data/ecommerce.db
  - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
  - JWT_EXPIRY=24h
  - ENABLE_RATE_LIMIT=true
```

### Data Persistence

The SQLite database is persisted in a Docker volume named `ecommerce-data`. This ensures your data survives container restarts.

---

## 📊 Performance Benchmarking

### Option 1: TypeScript Benchmark Script (Recommended)

The TypeScript benchmark script provides comprehensive metrics and detailed analysis.

#### Usage

```bash
# Basic benchmark (30s duration, 50 concurrent requests)
bun benchmark.ts

# Custom duration and concurrency
bun benchmark.ts --duration 60 --concurrency 100

# Limit requests per second
bun benchmark.ts --rps 1000

# Benchmark a remote server
bun benchmark.ts --host http://api.example.com

# Full options
bun benchmark.ts \
  --host http://localhost:3000 \
  --duration 60 \
  --concurrency 100 \
  --rps 500 \
  --warmup 10
```

#### Options

- `--host <url>` - API host URL (default: http://localhost:3000)
- `--duration <sec>` - Test duration in seconds per scenario (default: 30)
- `--concurrency <n>` - Number of concurrent requests (default: 50)
- `--rps <n>` - Target requests per second, 0 for unlimited (default: 0)
- `--warmup <sec>` - Warmup duration in seconds (default: 5)
- `--help` - Show help message

#### Features

- ✅ Multiple endpoint testing (health, products, cart, auth, etc.)
- ✅ Detailed metrics (RPS, response times, percentiles)
- ✅ Status code distribution
- ✅ JSON export of results
- ✅ Automatic test user setup
- ✅ Warmup phase to stabilize performance
- ✅ Rate limiting support

#### Output

The script provides:
- Real-time progress for each scenario
- Detailed metrics including:
  - Total requests and success rate
  - Requests per second
  - Average, min, and max response times
  - P50, P95, P99 percentiles
  - Status code distribution
- Overall summary across all tests
- JSON export file: `benchmark-results-<timestamp>.json`

### Option 2: Shell Script Benchmark

A simpler bash script that uses common benchmarking tools.

#### Prerequisites

Install one of these tools:

```bash
# Option 1: hey (recommended)
go install github.com/rakyll/hey@latest

# Option 2: Apache Bench
sudo apt-get install apache2-utils

# Option 3: wrk
sudo apt-get install wrk
```

#### Usage

```bash
# Make script executable
chmod +x benchmark.sh

# Run with defaults
./benchmark.sh

# Custom host, duration, and concurrency
./benchmark.sh http://localhost:3000 60 100
```

The script automatically detects which tool is available and uses it.

---

## 🎯 Benchmarking Scenarios

The TypeScript benchmark tests the following endpoints:

1. **Health Check** (`GET /health`)
   - Basic availability check
   - Weight: 10%

2. **API Status** (`GET /api/v1/status`)
   - Detailed API information
   - Weight: 5%

3. **List Products** (`GET /api/v1/products`)
   - Most common read operation
   - Weight: 20%

4. **Get Product Details** (`GET /api/v1/products/1`)
   - Individual product lookup
   - Weight: 15%

5. **List Categories** (`GET /api/v1/categories`)
   - Category browsing
   - Weight: 10%

6. **Get Cart** (`GET /api/v1/cart`)
   - User cart retrieval
   - Weight: 10%

7. **Get Current User** (`GET /api/v1/auth/me`)
   - Authentication check
   - Weight: 15%

8. **Get Inventory** (`GET /api/v1/inventory`)
   - Stock checking
   - Weight: 5%

---

## 📈 Understanding the Metrics

### Requests Per Second (RPS)
- Number of requests the server can handle per second
- Higher is better
- Typical ranges:
  - < 100 RPS: Needs optimization
  - 100-1000 RPS: Good for small-medium apps
  - 1000-10000 RPS: Excellent performance
  - > 10000 RPS: Outstanding

### Response Time
- Time taken to process a request (in milliseconds)
- Lower is better
- **Average**: Mean response time across all requests
- **P50 (Median)**: 50% of requests are faster than this
- **P95**: 95% of requests are faster than this (good indicator of worst-case for most users)
- **P99**: 99% of requests are faster than this (worst-case scenarios)

### Error Rate
- Percentage of failed requests
- Should be as close to 0% as possible
- Check status codes for details:
  - 2xx: Success
  - 4xx: Client errors
  - 5xx: Server errors

---

## 🔧 Optimization Tips

### Based on Benchmark Results

1. **High Response Times?**
   - Enable caching
   - Optimize database queries
   - Add database indexes
   - Use connection pooling

2. **Low RPS?**
   - Increase concurrency
   - Optimize heavy computations
   - Profile code for bottlenecks
   - Scale horizontally

3. **High Error Rate?**
   - Check server logs
   - Increase rate limits
   - Fix application bugs
   - Add more resources

### Docker Performance Tuning

1. **Resource Limits:**
```yaml
services:
  ecommerce-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

2. **Multiple Instances:**
```bash
docker-compose up --scale ecommerce-api=3
```

3. **Production Best Practices:**
   - Use a reverse proxy (nginx, traefik)
   - Enable HTTP/2
   - Add Redis for caching
   - Use a CDN for static assets
   - Monitor with Prometheus/Grafana

---

## 🧪 Example Benchmark Session

```bash
# 1. Start the application
docker-compose up -d

# 2. Wait for startup
sleep 5

# 3. Run quick benchmark (30 seconds)
bun benchmark.ts

# 4. Run intensive benchmark (60 seconds, 200 concurrent)
bun benchmark.ts --duration 60 --concurrency 200

# 5. Run rate-limited test
bun benchmark.ts --rps 1000 --duration 120

# 6. Check results
ls -lh benchmark-results-*.json
```

---

## 📊 Sample Output

```
🚀 E-Commerce API Performance Benchmark =====================================
Host: http://localhost:3000
Duration: 30s per scenario
Concurrency: 50
Warmup: 5s
================================================================================

🔧 Setting up test data...
✅ API is healthy
✅ Test user registered and authenticated

🔥 Warming up for 5 seconds...
✅ Warmup complete

📊 Benchmarking: List Products
   Method: GET
   Endpoint: /api/v1/products
   Duration: 30s
   Concurrency: 50

================================================================================
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

📡 Status Codes:
  200: 150,000
================================================================================
```

---

## 🐛 Troubleshooting

### Docker Issues

**Container won't start:**
```bash
docker-compose logs ecommerce-api
docker-compose down -v
docker-compose up --build
```

**Port already in use:**
```yaml
# Edit docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

### Benchmark Issues

**"API is not healthy" error:**
- Ensure the server is running
- Check the host URL
- Verify network connectivity

**Low performance in Docker:**
- Docker on Mac/Windows has overhead
- Use Docker on Linux for best performance
- Adjust resource limits in Docker Desktop

**Rate limiting triggered:**
- Increase rate limit in `.env.production`
- Set `ENABLE_RATE_LIMIT=false` for testing
- Reduce concurrency in benchmark

---

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [SQLite Performance Tuning](https://www.sqlite.org/speed.html)
- [Load Testing Best Practices](https://grafana.com/blog/2023/04/20/load-testing-best-practices/)

---

## 📝 License

MIT
