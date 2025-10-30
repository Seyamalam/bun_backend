package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

type BenchmarkResult struct {
	TotalRequests      int64         `json:"total_requests"`
	SuccessfulRequests int64         `json:"successful_requests"`
	FailedRequests     int64         `json:"failed_requests"`
	Duration           time.Duration `json:"duration"`
	RequestsPerSecond  float64       `json:"requests_per_second"`
	AvgResponseTime    float64       `json:"avg_response_time_ms"`
	MinResponseTime    float64       `json:"min_response_time_ms"`
	MaxResponseTime    float64       `json:"max_response_time_ms"`
	P50ResponseTime    float64       `json:"p50_response_time_ms"`
	P95ResponseTime    float64       `json:"p95_response_time_ms"`
	P99ResponseTime    float64       `json:"p99_response_time_ms"`
	ErrorRate          float64       `json:"error_rate"`
}

type Benchmark struct {
	url         string
	duration    time.Duration
	concurrency int
	warmup      time.Duration
	
	responseTimes []float64
	mu            sync.Mutex
	
	totalRequests      atomic.Int64
	successfulRequests atomic.Int64
	failedRequests     atomic.Int64
}

func NewBenchmark(url string, duration, warmup time.Duration, concurrency int) *Benchmark {
	return &Benchmark{
		url:           url,
		duration:      duration,
		concurrency:   concurrency,
		warmup:        warmup,
		responseTimes: make([]float64, 0),
	}
}

func (b *Benchmark) makeRequest(endpoint, method string, body map[string]interface{}) (int, time.Duration) {
	var reqBody io.Reader
	if body != nil {
		jsonData, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonData)
	}
	
	req, err := http.NewRequest(method, b.url+endpoint, reqBody)
	if err != nil {
		return 0, 0
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	
	start := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(start)
	
	if err != nil {
		return 0, duration
	}
	defer resp.Body.Close()
	
	io.ReadAll(resp.Body) // Consume body
	
	return resp.StatusCode, duration
}

func (b *Benchmark) worker(endpoint, method string, body map[string]interface{}, wg *sync.WaitGroup, done <-chan bool) {
	defer wg.Done()
	
	for {
		select {
		case <-done:
			return
		default:
			status, duration := b.makeRequest(endpoint, method, body)
			
			b.totalRequests.Add(1)
			
			if status >= 200 && status < 400 {
				b.successfulRequests.Add(1)
			} else {
				b.failedRequests.Add(1)
			}
			
			b.mu.Lock()
			b.responseTimes = append(b.responseTimes, float64(duration.Milliseconds()))
			b.mu.Unlock()
		}
	}
}

func (b *Benchmark) Run(endpoint, method string, body map[string]interface{}) BenchmarkResult {
	fmt.Printf("🔥 Warming up for %v...\n", b.warmup)
	
	// Warmup
	if b.warmup > 0 {
		warmupDone := make(chan bool)
		var warmupWg sync.WaitGroup
		
		for i := 0; i < b.concurrency; i++ {
			warmupWg.Add(1)
			go b.worker(endpoint, method, body, &warmupWg, warmupDone)
		}
		
		time.Sleep(b.warmup)
		close(warmupDone)
		warmupWg.Wait()
		
		// Reset counters
		b.totalRequests.Store(0)
		b.successfulRequests.Store(0)
		b.failedRequests.Store(0)
		b.mu.Lock()
		b.responseTimes = make([]float64, 0)
		b.mu.Unlock()
	}
	
	fmt.Printf("🚀 Running benchmark for %v with %d concurrent requests...\n", b.duration, b.concurrency)
	
	// Actual benchmark
	done := make(chan bool)
	var wg sync.WaitGroup
	
	start := time.Now()
	
	for i := 0; i < b.concurrency; i++ {
		wg.Add(1)
		go b.worker(endpoint, method, body, &wg, done)
	}
	
	time.Sleep(b.duration)
	close(done)
	wg.Wait()
	
	actualDuration := time.Since(start)
	
	// Calculate statistics
	return b.calculateResults(actualDuration)
}

func (b *Benchmark) calculateResults(duration time.Duration) BenchmarkResult {
	b.mu.Lock()
	defer b.mu.Unlock()
	
	total := b.totalRequests.Load()
	successful := b.successfulRequests.Load()
	failed := b.failedRequests.Load()
	
	result := BenchmarkResult{
		TotalRequests:      total,
		SuccessfulRequests: successful,
		FailedRequests:     failed,
		Duration:           duration,
		RequestsPerSecond:  float64(total) / duration.Seconds(),
		ErrorRate:          float64(failed) / float64(total) * 100,
	}
	
	if len(b.responseTimes) == 0 {
		return result
	}
	
	// Sort response times
	sort.Float64s(b.responseTimes)
	
	// Calculate statistics
	var sum float64
	for _, t := range b.responseTimes {
		sum += t
	}
	
	result.AvgResponseTime = sum / float64(len(b.responseTimes))
	result.MinResponseTime = b.responseTimes[0]
	result.MaxResponseTime = b.responseTimes[len(b.responseTimes)-1]
	result.P50ResponseTime = b.responseTimes[len(b.responseTimes)/2]
	result.P95ResponseTime = b.responseTimes[int(float64(len(b.responseTimes))*0.95)]
	result.P99ResponseTime = b.responseTimes[int(float64(len(b.responseTimes))*0.99)]
	
	return result
}

func printResults(name string, result BenchmarkResult) {
	fmt.Printf("\n📊 Results for %s:\n", name)
	fmt.Println("═══════════════════════════════════════")
	fmt.Printf("Total Requests:      %d\n", result.TotalRequests)
	fmt.Printf("Successful:          %d\n", result.SuccessfulRequests)
	fmt.Printf("Failed:              %d\n", result.FailedRequests)
	fmt.Printf("Duration:            %v\n", result.Duration)
	fmt.Printf("Requests/sec:        %.2f\n", result.RequestsPerSecond)
	fmt.Printf("Avg Response Time:   %.2f ms\n", result.AvgResponseTime)
	fmt.Printf("Min Response Time:   %.2f ms\n", result.MinResponseTime)
	fmt.Printf("Max Response Time:   %.2f ms\n", result.MaxResponseTime)
	fmt.Printf("P50 Response Time:   %.2f ms\n", result.P50ResponseTime)
	fmt.Printf("P95 Response Time:   %.2f ms\n", result.P95ResponseTime)
	fmt.Printf("P99 Response Time:   %.2f ms\n", result.P99ResponseTime)
	fmt.Printf("Error Rate:          %.2f%%\n", result.ErrorRate)
	fmt.Println("═══════════════════════════════════════")
}

func main() {
	url := flag.String("url", "http://localhost:3001", "Server URL")
	duration := flag.Int("duration", 30, "Test duration in seconds")
	concurrency := flag.Int("concurrency", 50, "Number of concurrent requests")
	warmup := flag.Int("warmup", 5, "Warmup duration in seconds")
	flag.Parse()
	
	bench := NewBenchmark(
		*url,
		time.Duration(*duration)*time.Second,
		time.Duration(*warmup)*time.Second,
		*concurrency,
	)
	
	fmt.Println("═══════════════════════════════════════")
	fmt.Println("     Go Backend Benchmark Tool")
	fmt.Println("═══════════════════════════════════════")
	fmt.Printf("URL:         %s\n", *url)
	fmt.Printf("Duration:    %d seconds\n", *duration)
	fmt.Printf("Concurrency: %d\n", *concurrency)
	fmt.Printf("Warmup:      %d seconds\n", *warmup)
	fmt.Println("═══════════════════════════════════════")
	
	// Test health endpoint
	fmt.Println("\n🏥 Testing /health endpoint...")
	healthResult := bench.Run("/health", "GET", nil)
	printResults("/health", healthResult)
	
	// Test products endpoint
	fmt.Println("\n📦 Testing /api/v1/products endpoint...")
	productsResult := bench.Run("/api/v1/products", "GET", nil)
	printResults("/api/v1/products", productsResult)
	
	// Summary
	fmt.Println("\n✅ Benchmark Complete!")
	fmt.Printf("Overall RPS: %.2f requests/second\n", 
		(float64(healthResult.TotalRequests) + float64(productsResult.TotalRequests)) / 
		(healthResult.Duration.Seconds() + productsResult.Duration.Seconds()))
}
