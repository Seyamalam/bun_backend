#!/bin/bash

# Quick benchmark script - starts Docker and runs benchmarks
# Usage: ./quick-benchmark.sh [duration] [concurrency]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DURATION="${1:-30}"
CONCURRENCY="${2:-50}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Quick E-Commerce API Benchmark${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting E-Commerce API with Docker Compose...${NC}"
docker-compose up -d --build

echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is ready!${NC}\n"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API failed to start. Check logs:${NC}"
        docker-compose logs ecommerce-api
        exit 1
    fi
done

echo -e "${BLUE}📊 Running benchmarks...${NC}\n"
bun benchmark.ts --duration "$DURATION" --concurrency "$CONCURRENCY"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Benchmark complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}View logs:${NC} docker-compose logs -f ecommerce-api"
echo -e "${YELLOW}Stop API:${NC}  docker-compose down"
echo -e "${YELLOW}Reset data:${NC} docker-compose down -v\n"
