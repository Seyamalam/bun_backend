# ⚡ Quick Reference - Docker & Benchmarking

## 🚀 Getting Started (3 Commands)

```bash
# 1. Start the API
docker-compose up -d

# 2. Run benchmark
bun benchmark.ts

# 3. View results
cat benchmark-results-*.json
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) | Docker deployment guide |
| [BENCHMARK_README.md](./BENCHMARK_README.md) | Complete benchmarking guide |
| [BENCHMARKING_SUITE.md](./BENCHMARKING_SUITE.md) | Tool comparison & use cases |
| [TASK_SUMMARY.md](./TASK_SUMMARY.md) | Complete overview |

## 🎯 Common Commands

### Docker
```bash
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f            # View logs
docker-compose restart            # Restart
docker-compose down -v            # Reset database
```

### Benchmarks
```bash
./quick-benchmark.sh                              # Easiest (one command)
./run-benchmark.sh                                # Interactive menu
bun benchmark.ts --duration 60 --concurrency 100  # Full benchmark
bun stress-test.ts                                # Find limits
bun load-test-scenarios.ts http://localhost:3000 60 10  # Real users
```

### NPM Scripts
```bash
bun run docker:up              # Start Docker
bun run docker:down            # Stop Docker
bun run benchmark              # Full benchmark
bun run benchmark:quick        # 30s quick test
bun run benchmark:stress       # Stress test
bun run benchmark:load         # Load test
bun run benchmark:interactive  # Menu
```

## 📊 Understanding Results

### Good Performance
- ✅ RPS > 1,000
- ✅ Avg Response < 100ms
- ✅ P95 < 200ms
- ✅ Error Rate < 1%

### Needs Optimization
- ⚠️ RPS < 100
- ⚠️ Avg Response > 500ms
- ⚠️ P95 > 1,000ms
- ⚠️ Error Rate > 5%

## 🛠️ Troubleshooting

### API not starting
```bash
docker-compose logs ecommerce-api
docker-compose down -v && docker-compose up -d
```

### Port conflict
Edit `docker-compose.yml` and change `"3000:3000"` to `"3001:3000"`

### Low performance
- Check rate limiting: Set `ENABLE_RATE_LIMIT=false` for testing
- Increase Docker resources (Settings → Resources)
- Use Linux (Docker on Mac/Windows has overhead)

## 🎓 Learn More

- [Official Bun Docs](https://bun.sh/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- API Docs: [README.md](./README.md)

---

**Need help? Read [BENCHMARK_README.md](./BENCHMARK_README.md) or [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)**
