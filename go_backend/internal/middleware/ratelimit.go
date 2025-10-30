package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
}

var limiter = &rateLimiter{
	requests: make(map[string][]time.Time),
}

// RateLimitMiddleware limits requests per IP
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	// Cleanup old entries periodically
	go func() {
		ticker := time.NewTicker(window)
		for range ticker.C {
			limiter.mu.Lock()
			now := time.Now()
			for key, times := range limiter.requests {
				filtered := []time.Time{}
				for _, t := range times {
					if now.Sub(t) < window {
						filtered = append(filtered, t)
					}
				}
				if len(filtered) == 0 {
					delete(limiter.requests, key)
				} else {
					limiter.requests[key] = filtered
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		// Skip rate limiting for GET requests
		if c.Request.Method == "GET" {
			c.Next()
			return
		}

		clientIP := c.ClientIP()
		key := clientIP + "-" + c.Request.URL.Path

		limiter.mu.Lock()
		defer limiter.mu.Unlock()

		now := time.Now()
		requests := limiter.requests[key]

		// Filter out old requests
		filtered := []time.Time{}
		for _, t := range requests {
			if now.Sub(t) < window {
				filtered = append(filtered, t)
			}
		}

		if len(filtered) >= maxRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":   false,
				"error":     "Rate limit exceeded",
				"code":      "RATE_LIMIT_EXCEEDED",
				"timestamp": now.Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		// Add current request
		filtered = append(filtered, now)
		limiter.requests[key] = filtered

		c.Next()
	}
}
