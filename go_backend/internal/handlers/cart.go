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

// GetCart gets the current user's cart
func GetCart(c *gin.Context) {
	userID, _ := c.Get("userID")

	db := database.GetDB()

	// Get or create cart
	var cartID string
	err := db.QueryRow("SELECT id FROM carts WHERE user_id = ?", userID).Scan(&cartID)
	if err == sql.ErrNoRows {
		// Create new cart
		cartID = utils.GenerateID()
		now := time.Now().Format(time.RFC3339)
		_, err = db.Exec("INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
			cartID, userID, now, now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success:   false,
				Error:     "Failed to create cart",
				Code:      "INTERNAL_ERROR",
				Timestamp: time.Now().Format(time.RFC3339),
			})
			return
		}
	}

	// Get cart items
	rows, err := db.Query(`
		SELECT ci.id, ci.cart_id, ci.product_id, ci.variant_id, ci.quantity, 
		       p.name, p.price, p.stock_quantity
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.cart_id = ?
	`, cartID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Database error",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	items := []gin.H{}
	var total float64
	for rows.Next() {
		var item models.CartItem
		var productName string
		var productPrice float64
		var stockQuantity int
		err := rows.Scan(&item.ID, &item.CartID, &item.ProductID, &item.VariantID,
			&item.Quantity, &productName, &productPrice, &stockQuantity)
		if err != nil {
			continue
		}

		itemTotal := float64(item.Quantity) * productPrice
		total += itemTotal

		items = append(items, gin.H{
			"id":          item.ID,
			"product_id":  item.ProductID,
			"variant_id":  item.VariantID,
			"quantity":    item.Quantity,
			"name":        productName,
			"price":       productPrice,
			"item_total":  itemTotal,
			"in_stock":    stockQuantity >= item.Quantity,
		})
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"cart_id": cartID,
			"items":   items,
			"total":   total,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// AddToCart adds an item to the cart
func AddToCart(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		ProductID string  `json:"product_id" binding:"required"`
		VariantID *string `json:"variant_id"`
		Quantity  int     `json:"quantity" binding:"required,gt=0"`
	}

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

	// Get or create cart
	var cartID string
	err := db.QueryRow("SELECT id FROM carts WHERE user_id = ?", userID).Scan(&cartID)
	if err == sql.ErrNoRows {
		cartID = utils.GenerateID()
		now := time.Now().Format(time.RFC3339)
		_, err = db.Exec("INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
			cartID, userID, now, now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success:   false,
				Error:     "Failed to create cart",
				Code:      "INTERNAL_ERROR",
				Timestamp: time.Now().Format(time.RFC3339),
			})
			return
		}
	}

	// Check if item already exists
	var existingItemID string
	err = db.QueryRow(`
		SELECT id FROM cart_items 
		WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
	`, cartID, req.ProductID, req.VariantID, req.VariantID).Scan(&existingItemID)

	now := time.Now().Format(time.RFC3339)
	if err == sql.ErrNoRows {
		// Add new item
		itemID := utils.GenerateID()
		_, err = db.Exec(`
			INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, itemID, cartID, req.ProductID, req.VariantID, req.Quantity, now, now)
	} else {
		// Update quantity
		_, err = db.Exec(`
			UPDATE cart_items SET quantity = quantity + ?, updated_at = ?
			WHERE id = ?
		`, req.Quantity, now, existingItemID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to add item to cart",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      gin.H{"message": "Item added to cart"},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// RemoveFromCart removes an item from cart
func RemoveFromCart(c *gin.Context) {
	userID, _ := c.Get("userID")
	itemID := c.Param("itemId")

	db := database.GetDB()

	// Verify item belongs to user's cart
	var cartID string
	err := db.QueryRow("SELECT id FROM carts WHERE user_id = ?", userID).Scan(&cartID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Cart not found",
			Code:      "NOT_FOUND",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	result, err := db.Exec("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemID, cartID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to remove item",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Item not found",
			Code:      "NOT_FOUND",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      gin.H{"message": "Item removed from cart"},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// ClearCart clears all items from cart
func ClearCart(c *gin.Context) {
	userID, _ := c.Get("userID")

	db := database.GetDB()

	var cartID string
	err := db.QueryRow("SELECT id FROM carts WHERE user_id = ?", userID).Scan(&cartID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Cart not found",
			Code:      "NOT_FOUND",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	_, err = db.Exec("DELETE FROM cart_items WHERE cart_id = ?", cartID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to clear cart",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      gin.H{"message": "Cart cleared"},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}
