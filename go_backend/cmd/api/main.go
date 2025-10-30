package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Seyamalam/bun_backend/go_backend/internal/database"
	"github.com/Seyamalam/bun_backend/go_backend/internal/handlers"
	"github.com/Seyamalam/bun_backend/go_backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func main() {
	// Get environment variables
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	nodeEnv := os.Getenv("NODE_ENV")
	if nodeEnv == "" {
		nodeEnv = "development"
	}

	enableRateLimit := os.Getenv("ENABLE_RATE_LIMIT")
	if enableRateLimit == "" {
		enableRateLimit = "true"
	}

	// Set Gin mode
	if nodeEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	_ = database.GetDB()
	log.Println("🗄️ Database: Connected")

	// Create router
	r := gin.New()

	// Add middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Security headers middleware
	r.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	})

	// Rate limiting
	if enableRateLimit == "true" {
		r.Use(middleware.RateLimitMiddleware(100, 60*time.Second))
		log.Println("⏱️ Rate limiting: Enabled")
	} else {
		log.Println("⏱️ Rate limiting: Disabled")
	}

	// Health routes
	r.GET("/health", handlers.HealthCheck)
	r.GET("/api/v1/status", handlers.APIStatus)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.AuthMiddleware(), handlers.GetCurrentUser)
		}

		// Product routes (public for reading)
		products := v1.Group("/products")
		{
			products.GET("", handlers.ListProducts)
			products.GET("/:id", handlers.GetProduct)
			products.POST("", middleware.AuthMiddleware(), handlers.CreateProduct)
		}

		// Category routes
		categories := v1.Group("/categories")
		{
			categories.GET("", handlers.ListCategories)
			categories.POST("", middleware.AuthMiddleware(), handlers.CreateCategory)
		}

		// Cart routes (protected)
		cart := v1.Group("/cart")
		cart.Use(middleware.AuthMiddleware())
		{
			cart.GET("", handlers.GetCart)
			cart.DELETE("", handlers.ClearCart)
			cart.POST("/items", handlers.AddToCart)
			cart.DELETE("/items/:itemId", handlers.RemoveFromCart)
		}

		// Order routes (protected)
		orders := v1.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.GET("", handlers.GetUserOrders)
			orders.POST("", handlers.CreateOrder)
			orders.GET("/:id", handlers.GetOrder)
			orders.DELETE("/:id", handlers.CancelOrder)
		}
	}

	// 404 handler
	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"success":   false,
			"error":     "Not found",
			"code":      "NOT_FOUND",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// Start server
	log.Printf("🚀 E-Commerce Backend Server (Go) running on http://localhost:%s\n", port)
	log.Printf("📝 Environment: %s\n", nodeEnv)

	// Graceful shutdown
	go func() {
		if err := r.Run(":" + port); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("\n🛑 Shutting down gracefully...")
	if err := database.Close(); err != nil {
		log.Println("Error closing database:", err)
	}
	log.Println("✅ Shutdown complete")
}
