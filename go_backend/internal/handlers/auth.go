package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/Seyamalam/bun_backend/go_backend/internal/database"
	"github.com/Seyamalam/bun_backend/go_backend/internal/models"
	"github.com/Seyamalam/bun_backend/go_backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// Register handles user registration
func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Code:      "VALIDATION_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Validate password confirmation
	if req.Password != req.PasswordConfirm {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Passwords do not match",
			Code:      "VALIDATION_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Validate email format
	if !utils.IsValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Invalid email format",
			Code:      "VALIDATION_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Validate password strength
	if !utils.IsValidPassword(req.Password) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Password must be at least 8 characters with uppercase, lowercase, and numbers",
			Code:      "VALIDATION_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	db := database.GetDB()

	// Check if email already exists
	var existingID string
	err := db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, models.APIResponse{
			Success:   false,
			Error:     "Email already registered",
			Code:      "CONFLICT",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to hash password",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Create user
	userID := utils.GenerateID()
	now := time.Now().Format(time.RFC3339)

	_, err = db.Exec(`
		INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, userID, req.Email, passwordHash, req.FirstName, req.LastName, req.Phone, "customer", true, false, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to create user",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Generate token
	token, err := utils.GenerateToken(userID, "customer")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to generate token",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	user := models.User{
		ID:            userID,
		Email:         req.Email,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Phone:         req.Phone,
		Role:          "customer",
		IsActive:      true,
		EmailVerified: false,
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"token": token,
			"user":  user,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// Login handles user login
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Code:      "VALIDATION_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	db := database.GetDB()

	// Get user by email
	var user models.User
	var passwordHash string
	err := db.QueryRow(`
		SELECT id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at
		FROM users WHERE email = ?
	`, req.Email).Scan(
		&user.ID, &user.Email, &passwordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.IsActive, &user.EmailVerified,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success:   false,
			Error:     "Invalid credentials",
			Code:      "UNAUTHORIZED",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Database error",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Verify password
	if !utils.VerifyPassword(req.Password, passwordHash) {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success:   false,
			Error:     "Invalid credentials",
			Code:      "UNAUTHORIZED",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success:   false,
			Error:     "Account is inactive",
			Code:      "FORBIDDEN",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to generate token",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"token": token,
			"user":  user,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// GetCurrentUser returns the current authenticated user
func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	db := database.GetDB()
	var user models.User
	err := db.QueryRow(`
		SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at
		FROM users WHERE id = ?
	`, userID).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.IsActive, &user.EmailVerified,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "User not found",
			Code:      "NOT_FOUND",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      user,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// Logout handles user logout (client-side token removal)
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      gin.H{"message": "Logged out successfully"},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}
