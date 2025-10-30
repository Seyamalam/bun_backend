package handlers

import (
	"database/sql"
	"math"
	"net/http"
	"time"

	"github.com/Seyamalam/bun_backend/go_backend/internal/database"
	"github.com/Seyamalam/bun_backend/go_backend/internal/models"
	"github.com/Seyamalam/bun_backend/go_backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// GetUserOrders lists all orders for the current user
func GetUserOrders(c *gin.Context) {
	userID, _ := c.Get("userID")
	page, limit, offset := utils.ValidatePagination(c.Query("page"), c.Query("limit"))

	db := database.GetDB()

	// Get total count
	var total int
	err := db.QueryRow("SELECT COUNT(*) FROM orders WHERE user_id = ?", userID).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Database error",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Get orders
	rows, err := db.Query(`
		SELECT id, user_id, status, total_amount, shipping_address_id, created_at, updated_at
		FROM orders WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset)
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

	orders := []models.Order{}
	for rows.Next() {
		var o models.Order
		err := rows.Scan(&o.ID, &o.UserID, &o.Status, &o.TotalAmount,
			&o.ShippingAddressID, &o.CreatedAt, &o.UpdatedAt)
		if err != nil {
			continue
		}
		orders = append(orders, o)
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.ListResponse{
			Data: orders,
			Pagination: models.PaginationResponse{
				Page:  page,
				Limit: limit,
				Total: total,
				Pages: pages,
			},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// GetOrder gets a single order by ID
func GetOrder(c *gin.Context) {
	userID, _ := c.Get("userID")
	orderID := c.Param("id")

	db := database.GetDB()

	var order models.Order
	err := db.QueryRow(`
		SELECT id, user_id, status, total_amount, shipping_address_id, created_at, updated_at
		FROM orders WHERE id = ? AND user_id = ?
	`, orderID, userID).Scan(
		&order.ID, &order.UserID, &order.Status, &order.TotalAmount,
		&order.ShippingAddressID, &order.CreatedAt, &order.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Order not found",
			Code:      "NOT_FOUND",
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

	// Get order items
	rows, err := db.Query(`
		SELECT id, order_id, product_id, variant_id, quantity, unit_price, total_price, created_at
		FROM order_items WHERE order_id = ?
	`, orderID)
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

	items := []models.OrderItem{}
	for rows.Next() {
		var item models.OrderItem
		err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.VariantID,
			&item.Quantity, &item.UnitPrice, &item.TotalPrice, &item.CreatedAt)
		if err != nil {
			continue
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"order": order,
			"items": items,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// CreateOrder creates a new order from cart
func CreateOrder(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		ShippingAddressID string `json:"shipping_address_id" binding:"required"`
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

	// Get cart
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

	// Get cart items
	rows, err := db.Query(`
		SELECT ci.product_id, ci.variant_id, ci.quantity, p.price, p.stock_quantity
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

	type CartItemData struct {
		ProductID     string
		VariantID     *string
		Quantity      int
		Price         float64
		StockQuantity int
	}

	cartItems := []CartItemData{}
	var totalAmount float64
	for rows.Next() {
		var item CartItemData
		err := rows.Scan(&item.ProductID, &item.VariantID, &item.Quantity, &item.Price, &item.StockQuantity)
		if err != nil {
			continue
		}

		if item.StockQuantity < item.Quantity {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success:   false,
				Error:     "Insufficient stock for product",
				Code:      "INSUFFICIENT_STOCK",
				Timestamp: time.Now().Format(time.RFC3339),
			})
			return
		}

		cartItems = append(cartItems, item)
		totalAmount += item.Price * float64(item.Quantity)
	}

	if len(cartItems) == 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Cart is empty",
			Code:      "EMPTY_CART",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Create order
	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to start transaction",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer tx.Rollback()

	orderID := utils.GenerateID()
	now := time.Now().Format(time.RFC3339)

	_, err = tx.Exec(`
		INSERT INTO orders (id, user_id, status, total_amount, shipping_address_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, orderID, userID, "pending", totalAmount, req.ShippingAddressID, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to create order",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Create order items and update stock
	for _, item := range cartItems {
		itemID := utils.GenerateID()
		itemTotal := item.Price * float64(item.Quantity)

		_, err = tx.Exec(`
			INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, itemID, orderID, item.ProductID, item.VariantID, item.Quantity, item.Price, itemTotal, now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success:   false,
				Error:     "Failed to create order items",
				Code:      "INTERNAL_ERROR",
				Timestamp: time.Now().Format(time.RFC3339),
			})
			return
		}

		// Update stock
		_, err = tx.Exec(`
			UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
		`, item.Quantity, item.ProductID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success:   false,
				Error:     "Failed to update stock",
				Code:      "INTERNAL_ERROR",
				Timestamp: time.Now().Format(time.RFC3339),
			})
			return
		}
	}

	// Clear cart
	_, err = tx.Exec("DELETE FROM cart_items WHERE cart_id = ?", cartID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to clear cart",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to commit transaction",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"order_id":     orderID,
			"total_amount": totalAmount,
			"status":       "pending",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// CancelOrder cancels an order
func CancelOrder(c *gin.Context) {
	userID, _ := c.Get("userID")
	orderID := c.Param("id")

	db := database.GetDB()

	// Check if order exists and belongs to user
	var status string
	err := db.QueryRow("SELECT status FROM orders WHERE id = ? AND user_id = ?", orderID, userID).Scan(&status)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Order not found",
			Code:      "NOT_FOUND",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	if status != "pending" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success:   false,
			Error:     "Order cannot be cancelled",
			Code:      "INVALID_STATUS",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	now := time.Now().Format(time.RFC3339)
	_, err = db.Exec("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", "cancelled", now, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to cancel order",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      gin.H{"message": "Order cancelled"},
		Timestamp: time.Now().Format(time.RFC3339),
	})
}
