#!/bin/bash

# Interactive Benchmark Runner
# Helps users choose the right benchmark for their needs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ${CYAN}E-Commerce API Performance Testing Suite${BLUE}            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

# Check if API is running
echo -e "${YELLOW}🔍 Checking if API is running...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is running${NC}\n"
else
    echo -e "${RED}❌ API is not running${NC}"
    echo -e "${YELLOW}Would you like to start it with Docker? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📦 Starting API with Docker Compose...${NC}"
        docker-compose up -d
        echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
        for i in {1..30}; do
            if curl -s http://localhost:3000/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ API is ready!${NC}\n"
                break
            fi
            sleep 1
        done
    else
        echo -e "${RED}Please start the API first:${NC}"
        echo -e "  bun index.ts"
        echo -e "  OR"
        echo -e "  docker-compose up -d"
        exit 1
    fi
fi

# Show menu
echo -e "${CYAN}Choose a benchmark type:${NC}\n"
echo -e "  ${GREEN}1)${NC} Quick Benchmark (30s, recommended for first-time users)"
echo -e "     Tests basic endpoints with moderate load"
echo -e ""
echo -e "  ${GREEN}2)${NC} Comprehensive Benchmark (customizable duration and concurrency)"
echo -e "     Tests all major endpoints with detailed metrics"
echo -e ""
echo -e "  ${GREEN}3)${NC} Stress Test (find performance limits)"
echo -e "     Gradually increases load to identify breaking points"
echo -e ""
echo -e "  ${GREEN}4)${NC} Load Test with Real-World Scenarios (simulates actual users)"
echo -e "     Realistic user behavior: browsing, adding to cart, checkout"
echo -e ""
echo -e "  ${GREEN}5)${NC} Shell-based Benchmark (uses hey/ab/wrk)"
echo -e "     Uses external benchmarking tools"
echo -e ""
echo -e "  ${GREEN}6)${NC} Custom Benchmark (advanced users)"
echo -e "     Full control over all parameters"
echo -e ""
echo -e "  ${RED}0)${NC} Exit"
echo -e ""
echo -n "Enter your choice [0-6]: "
read -r choice

case $choice in
    1)
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Quick Benchmark (30s)${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        bun benchmark.ts --duration 30 --concurrency 50 --warmup 5
        ;;
    
    2)
        echo -e "\n${YELLOW}Duration in seconds [default: 60]:${NC} "
        read -r duration
        duration=${duration:-60}
        
        echo -e "${YELLOW}Concurrent requests [default: 50]:${NC} "
        read -r concurrency
        concurrency=${concurrency:-50}
        
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Comprehensive Benchmark${NC}"
        echo -e "  Duration: ${duration}s"
        echo -e "  Concurrency: ${concurrency}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        bun benchmark.ts --duration "$duration" --concurrency "$concurrency"
        ;;
    
    3)
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Stress Test${NC}"
        echo -e "${YELLOW}This will gradually increase load to find limits${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        bun stress-test.ts
        ;;
    
    4)
        echo -e "\n${YELLOW}Test duration in seconds [default: 60]:${NC} "
        read -r duration
        duration=${duration:-60}
        
        echo -e "${YELLOW}Number of concurrent users [default: 10]:${NC} "
        read -r users
        users=${users:-10}
        
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Load Test with Real Scenarios${NC}"
        echo -e "  Duration: ${duration}s"
        echo -e "  Users: ${users}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        bun load-test-scenarios.ts http://localhost:3000 "$duration" "$users"
        ;;
    
    5)
        echo -e "\n${YELLOW}Duration in seconds [default: 30]:${NC} "
        read -r duration
        duration=${duration:-30}
        
        echo -e "${YELLOW}Concurrent requests [default: 50]:${NC} "
        read -r concurrency
        concurrency=${concurrency:-50}
        
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Shell-based Benchmark${NC}"
        echo -e "  Duration: ${duration}s"
        echo -e "  Concurrency: ${concurrency}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        ./benchmark.sh http://localhost:3000 "$duration" "$concurrency"
        ;;
    
    6)
        echo -e "\n${YELLOW}API host [default: http://localhost:3000]:${NC} "
        read -r host
        host=${host:-http://localhost:3000}
        
        echo -e "${YELLOW}Duration in seconds [default: 60]:${NC} "
        read -r duration
        duration=${duration:-60}
        
        echo -e "${YELLOW}Concurrent requests [default: 50]:${NC} "
        read -r concurrency
        concurrency=${concurrency:-50}
        
        echo -e "${YELLOW}Target RPS (0 for unlimited) [default: 0]:${NC} "
        read -r rps
        rps=${rps:-0}
        
        echo -e "${YELLOW}Warmup duration in seconds [default: 5]:${NC} "
        read -r warmup
        warmup=${warmup:-5}
        
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}Running Custom Benchmark${NC}"
        echo -e "  Host: ${host}"
        echo -e "  Duration: ${duration}s"
        echo -e "  Concurrency: ${concurrency}"
        echo -e "  Target RPS: ${rps}"
        echo -e "  Warmup: ${warmup}s"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        bun benchmark.ts --host "$host" --duration "$duration" --concurrency "$concurrency" --rps "$rps" --warmup "$warmup"
        ;;
    
    0)
        echo -e "\n${GREEN}Goodbye!${NC}\n"
        exit 0
        ;;
    
    *)
        echo -e "\n${RED}Invalid choice. Please run the script again.${NC}\n"
        exit 1
        ;;
esac

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Benchmark Complete! 🎉                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}📊 Results have been saved to the current directory${NC}"
echo -e "${CYAN}📄 Check the JSON files for detailed metrics${NC}\n"

echo -e "${YELLOW}Quick Commands:${NC}"
echo -e "  View logs:     ${BLUE}docker-compose logs -f${NC}"
echo -e "  Stop API:      ${BLUE}docker-compose down${NC}"
echo -e "  Run again:     ${BLUE}./run-benchmark.sh${NC}\n"
