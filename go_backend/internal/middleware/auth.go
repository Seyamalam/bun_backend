package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/Seyamalam/bun_backend/go_backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success":   false,
				"error":     "Authorization header required",
				"code":      "UNAUTHORIZED",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success":   false,
				"error":     "Invalid authorization header format",
				"code":      "UNAUTHORIZED",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		token := parts[1]
		userID, role, err := utils.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success":   false,
				"error":     "Invalid or expired token",
				"code":      "UNAUTHORIZED",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("userID", userID)
		c.Set("role", role)
		c.Next()
	}
}

// RequireRole checks if user has required role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success":   false,
				"error":     "Access denied",
				"code":      "FORBIDDEN",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		if role != requiredRole && role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"success":   false,
				"error":     "Access denied",
				"code":      "FORBIDDEN",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
