#!/bin/bash

# E-Commerce API Benchmark Script
# Uses Apache Bench (ab) and hey for load testing
# 
# Usage: ./benchmark.sh [host] [duration] [concurrency]
# Example: ./benchmark.sh http://localhost:3000 30 100

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOST="${1:-http://localhost:3000}"
DURATION="${2:-30}"
CONCURRENCY="${3:-50}"
REQUESTS_PER_ENDPOINT=10000

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 E-Commerce API Benchmark${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Host: ${GREEN}${HOST}${NC}"
echo -e "Duration: ${GREEN}${DURATION}s${NC}"
echo -e "Concurrency: ${GREEN}${CONCURRENCY}${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if server is running
echo -e "${YELLOW}🔍 Checking server health...${NC}"
if curl -s "${HOST}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is healthy${NC}\n"
else
    echo -e "${RED}❌ Server is not responding. Please start the server first.${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Determine which tool to use
TOOL=""
if command_exists hey; then
    TOOL="hey"
    echo -e "${GREEN}✅ Using 'hey' for benchmarking${NC}\n"
elif command_exists ab; then
    TOOL="ab"
    echo -e "${GREEN}✅ Using 'ab' (Apache Bench) for benchmarking${NC}\n"
elif command_exists wrk; then
    TOOL="wrk"
    echo -e "${GREEN}✅ Using 'wrk' for benchmarking${NC}\n"
else
    echo -e "${RED}❌ No benchmark tool found. Please install one of: hey, ab, or wrk${NC}"
    echo -e "${YELLOW}Install hey: go install github.com/rakyll/hey@latest${NC}"
    echo -e "${YELLOW}Install ab: sudo apt-get install apache2-utils${NC}"
    echo -e "${YELLOW}Install wrk: sudo apt-get install wrk${NC}"
    exit 1
fi

# Create results directory
RESULTS_DIR="benchmark-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Function to run benchmark with hey
run_hey() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}📊 Testing: ${description}${NC}"
    echo -e "${BLUE}    ${method} ${endpoint}${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    hey -z "${DURATION}s" -c "${CONCURRENCY}" -m "${method}" "${HOST}${endpoint}" | tee "${RESULTS_DIR}/${description// /_}.txt"
}

# Function to run benchmark with ab
run_ab() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}📊 Testing: ${description}${NC}"
    echo -e "${BLUE}    ${method} ${endpoint}${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    ab -t "${DURATION}" -c "${CONCURRENCY}" "${HOST}${endpoint}" | tee "${RESULTS_DIR}/${description// /_}.txt"
}

# Function to run benchmark with wrk
run_wrk() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}📊 Testing: ${description}${NC}"
    echo -e "${BLUE}    ${method} ${endpoint}${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    wrk -t4 -c"${CONCURRENCY}" -d"${DURATION}s" "${HOST}${endpoint}" | tee "${RESULTS_DIR}/${description// /_}.txt"
}

# Select the appropriate runner function
case "$TOOL" in
    hey)
        run_test() { run_hey "$@"; }
        ;;
    ab)
        run_test() { run_ab "$@"; }
        ;;
    wrk)
        run_test() { run_wrk "$@"; }
        ;;
esac

# Warmup
echo -e "${YELLOW}🔥 Warming up (5 seconds)...${NC}"
curl -s "${HOST}/health" > /dev/null
sleep 5
echo -e "${GREEN}✅ Warmup complete${NC}\n"

# Run benchmarks on various endpoints
run_test "/health" "GET" "Health_Check"
run_test "/api/v1/status" "GET" "API_Status"
run_test "/api/v1/products" "GET" "List_Products"
run_test "/api/v1/products/1" "GET" "Get_Product_Details"
run_test "/api/v1/categories" "GET" "List_Categories"

# Generate summary report
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Benchmark Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Results saved to: ${RESULTS_DIR}${NC}\n"

# Create a summary file
cat > "${RESULTS_DIR}/summary.txt" << EOF
E-Commerce API Benchmark Summary
================================

Configuration:
- Host: ${HOST}
- Duration: ${DURATION}s per endpoint
- Concurrency: ${CONCURRENCY}
- Tool: ${TOOL}
- Timestamp: $(date -Iseconds)

Test Results:
$(for file in ${RESULTS_DIR}/*.txt; do
    if [ "$(basename "$file")" != "summary.txt" ]; then
        echo "- $(basename "$file" .txt)"
    fi
done)

For detailed results, see individual test files in ${RESULTS_DIR}/
EOF

echo -e "${GREEN}📄 Summary saved to: ${RESULTS_DIR}/summary.txt${NC}\n"

# If hey was used, extract key metrics
if [ "$TOOL" = "hey" ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}🎯 Key Metrics Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    for file in ${RESULTS_DIR}/*.txt; do
        if [ "$(basename "$file")" != "summary.txt" ]; then
            testname=$(basename "$file" .txt | tr '_' ' ')
            rps=$(grep "Requests/sec:" "$file" | awk '{print $2}' || echo "N/A")
            avg=$(grep "Average:" "$file" | head -1 | awk '{print $2}' || echo "N/A")
            echo -e "${YELLOW}${testname}:${NC}"
            echo -e "  RPS: ${GREEN}${rps}${NC}"
            echo -e "  Avg Response: ${GREEN}${avg}${NC}"
        fi
    done
    echo -e "${BLUE}========================================${NC}\n"
fi

echo -e "${GREEN}✅ Benchmark completed successfully!${NC}\n"
