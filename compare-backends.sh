#!/bin/bash

# Backend Comparison Benchmark Script
# Compares Bun and Go backends and generates a comprehensive report

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BUN_PORT=3000
GO_PORT=3001
DURATION=${1:-30}
CONCURRENCY=${2:-50}
WARMUP=5
REPORT_DIR="benchmark_reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create report directory
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    ${CYAN}Backend Performance Comparison: Bun vs Go${BLUE}              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Duration:     ${DURATION} seconds"
echo -e "  Concurrency:  ${CONCURRENCY} requests"
echo -e "  Warmup:       ${WARMUP} seconds"
echo -e "  Bun Port:     ${BUN_PORT}"
echo -e "  Go Port:      ${GO_PORT}\n"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Bun backend
start_bun() {
    echo -e "${YELLOW}🚀 Starting Bun backend on port ${BUN_PORT}...${NC}"
    cd /home/runner/work/bun_backend/bun_backend
    PORT=$BUN_PORT ENABLE_RATE_LIMIT=false bun index.ts > /tmp/bun_backend.log 2>&1 &
    BUN_PID=$!
    echo "Bun PID: $BUN_PID"
    
    # Wait for server to be ready
    for i in {1..30}; do
        if check_port $BUN_PORT; then
            echo -e "${GREEN}✅ Bun backend is ready${NC}\n"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Failed to start Bun backend${NC}"
    return 1
}

# Function to start Go backend
start_go() {
    echo -e "${YELLOW}🚀 Starting Go backend on port ${GO_PORT}...${NC}"
    cd /home/runner/work/bun_backend/bun_backend/go_backend
    PORT=$GO_PORT ENABLE_RATE_LIMIT=false ./bin/server > /tmp/go_backend.log 2>&1 &
    GO_PID=$!
    echo "Go PID: $GO_PID"
    
    # Wait for server to be ready
    for i in {1..30}; do
        if check_port $GO_PORT; then
            echo -e "${GREEN}✅ Go backend is ready${NC}\n"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Failed to start Go backend${NC}"
    return 1
}

# Function to stop backend
stop_backend() {
    local pid=$1
    local name=$2
    if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || true
        wait $pid 2>/dev/null || true
    fi
}

# Function to run hey benchmark
run_hey_benchmark() {
    local url=$1
    local name=$2
    local output_file=$3
    
    echo -e "${CYAN}📊 Benchmarking $name with hey...${NC}"
    
    if command -v hey &> /dev/null; then
        hey -z ${DURATION}s -c $CONCURRENCY -q 0 -t 10 "$url" > "$output_file" 2>&1
        echo -e "${GREEN}✅ Completed${NC}\n"
    else
        echo -e "${YELLOW}⚠️  'hey' not installed, skipping...${NC}\n"
    fi
}

# Function to run ab benchmark
run_ab_benchmark() {
    local url=$1
    local name=$2
    local output_file=$3
    
    echo -e "${CYAN}📊 Benchmarking $name with ApacheBench...${NC}"
    
    if command -v ab &> /dev/null; then
        local total_requests=$((DURATION * CONCURRENCY * 10))
        ab -n $total_requests -c $CONCURRENCY -t $DURATION "$url" > "$output_file" 2>&1
        echo -e "${GREEN}✅ Completed${NC}\n"
    else
        echo -e "${YELLOW}⚠️  'ab' not installed, skipping...${NC}\n"
    fi
}

# Function to extract metrics from hey output
parse_hey_output() {
    local file=$1
    local rps=$(grep "Requests/sec:" "$file" | awk '{print $2}')
    local avg_time=$(grep "Average:" "$file" | awk '{print $2}')
    local p95_time=$(grep "95%" "$file" | awk '{print $2}')
    
    echo "$rps|$avg_time|$p95_time"
}

# Function to extract metrics from ab output
parse_ab_output() {
    local file=$1
    local rps=$(grep "Requests per second:" "$file" | awk '{print $4}')
    local avg_time=$(grep "Time per request:" "$file" | head -1 | awk '{print $4}')
    local p95_time=$(grep "95%" "$file" | awk '{print $2}')
    
    echo "$rps|$avg_time|$p95_time"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    stop_backend $BUN_PID "Bun backend"
    stop_backend $GO_PID "Go backend"
    rm -f /tmp/ecommerce.db 2>/dev/null || true
}

trap cleanup EXIT

# Main benchmark execution
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Phase 1: Bun Backend Benchmark${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Start Bun backend
if start_bun; then
    sleep 2
    
    # Run benchmarks
    run_hey_benchmark "http://localhost:$BUN_PORT/health" "Bun /health" "$REPORT_DIR/bun_health_hey_$TIMESTAMP.txt"
    run_hey_benchmark "http://localhost:$BUN_PORT/api/v1/products" "Bun /products" "$REPORT_DIR/bun_products_hey_$TIMESTAMP.txt"
    run_ab_benchmark "http://localhost:$BUN_PORT/health" "Bun /health" "$REPORT_DIR/bun_health_ab_$TIMESTAMP.txt"
    run_ab_benchmark "http://localhost:$BUN_PORT/api/v1/products" "Bun /products" "$REPORT_DIR/bun_products_ab_$TIMESTAMP.txt"
    
    # Stop Bun
    stop_backend $BUN_PID "Bun backend"
    sleep 2
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Phase 2: Go Backend Benchmark${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Start Go backend
if start_go; then
    sleep 2
    
    # Run benchmarks
    run_hey_benchmark "http://localhost:$GO_PORT/health" "Go /health" "$REPORT_DIR/go_health_hey_$TIMESTAMP.txt"
    run_hey_benchmark "http://localhost:$GO_PORT/api/v1/products" "Go /products" "$REPORT_DIR/go_products_hey_$TIMESTAMP.txt"
    run_ab_benchmark "http://localhost:$GO_PORT/health" "Go /health" "$REPORT_DIR/go_health_ab_$TIMESTAMP.txt"
    run_ab_benchmark "http://localhost:$GO_PORT/api/v1/products" "Go /products" "$REPORT_DIR/go_products_ab_$TIMESTAMP.txt"
    
    # Stop Go
    stop_backend $GO_PID "Go backend"
fi

# Generate comparison report
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Generating Comparison Report${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

REPORT_FILE="$REPORT_DIR/comparison_report_$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# Backend Performance Comparison Report
Generated: $(date)

## Test Configuration
- **Duration**: ${DURATION} seconds
- **Concurrency**: ${CONCURRENCY} requests
- **Warmup**: ${WARMUP} seconds

## Summary

### Bun Backend (TypeScript)
- **Runtime**: Bun
- **Framework**: Native Bun HTTP server
- **Port**: ${BUN_PORT}

### Go Backend
- **Runtime**: Go $(go version | awk '{print $3}')
- **Framework**: Gin
- **Port**: ${GO_PORT}

## Benchmark Results

EOF

# Add hey results if available
if [ -f "$REPORT_DIR/bun_health_hey_$TIMESTAMP.txt" ]; then
    echo "### Health Endpoint (/health)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "#### Bun Backend" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 10 "Summary:" "$REPORT_DIR/bun_health_hey_$TIMESTAMP.txt" >> "$REPORT_FILE" 2>/dev/null || echo "No data" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ -f "$REPORT_DIR/go_health_hey_$TIMESTAMP.txt" ]; then
    echo "#### Go Backend" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 10 "Summary:" "$REPORT_DIR/go_health_hey_$TIMESTAMP.txt" >> "$REPORT_FILE" 2>/dev/null || echo "No data" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ -f "$REPORT_DIR/bun_products_hey_$TIMESTAMP.txt" ]; then
    echo "### Products Endpoint (/api/v1/products)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "#### Bun Backend" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 10 "Summary:" "$REPORT_DIR/bun_products_hey_$TIMESTAMP.txt" >> "$REPORT_FILE" 2>/dev/null || echo "No data" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ -f "$REPORT_DIR/go_products_hey_$TIMESTAMP.txt" ]; then
    echo "#### Go Backend" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 10 "Summary:" "$REPORT_DIR/go_products_hey_$TIMESTAMP.txt" >> "$REPORT_FILE" 2>/dev/null || echo "No data" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo "## Conclusion" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Detailed benchmark results are available in the \`$REPORT_DIR\` directory." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Files Generated" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
ls -lh "$REPORT_DIR"/*_$TIMESTAMP.* >> "$REPORT_FILE" 2>/dev/null || true
echo '```' >> "$REPORT_FILE"

echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}\n"

# Display quick summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ${GREEN}Benchmark Complete!${BLUE}                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}📄 Report saved to: ${GREEN}$REPORT_FILE${NC}"
echo -e "${CYAN}📁 All results in: ${GREEN}$REPORT_DIR/${NC}\n"

echo -e "${YELLOW}Quick Commands:${NC}"
echo -e "  View report:     ${BLUE}cat $REPORT_FILE${NC}"
echo -e "  List results:    ${BLUE}ls -lh $REPORT_DIR/${NC}"
echo -e "  Re-run:          ${BLUE}./compare-backends.sh [duration] [concurrency]${NC}\n"
