package handlers

import (
	"net/http"
	"time"

	"github.com/Seyamalam/bun_backend/go_backend/internal/database"
	"github.com/gin-gonic/gin"
)

// HealthCheck returns the health status of the API
func HealthCheck(c *gin.Context) {
	db := database.GetDB()
	
	// Check database connection
	err := db.Ping()
	dbStatus := "connected"
	if err != nil {
		dbStatus = "disconnected"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"database":  dbStatus,
	})
}

// APIStatus returns detailed API status
func APIStatus(c *gin.Context) {
	db := database.GetDB()
	
	// Check database connection
	err := db.Ping()
	dbStatus := "connected"
	if err != nil {
		dbStatus = "disconnected"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"version":   "1.0.0",
			"status":    "operational",
			"database":  dbStatus,
			"timestamp": time.Now().Format(time.RFC3339),
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
