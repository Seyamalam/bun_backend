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

// ListProducts lists all products with pagination
func ListProducts(c *gin.Context) {
	page, limit, offset := utils.ValidatePagination(
		c.Query("page"),
		c.Query("limit"),
	)

	search := utils.SanitizeSearchQuery(c.Query("search"))

	db := database.GetDB()

	// Build query
	query := "SELECT id, name, description, price, category_id, vendor_id, status, stock_quantity, sku, created_at, updated_at FROM products WHERE status = ?"
	args := []interface{}{"active"}

	if search != "" {
		query += " AND (name LIKE ? OR description LIKE ?)"
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM products WHERE status = ?"
	countArgs := []interface{}{"active"}
	if search != "" {
		countQuery += " AND (name LIKE ? OR description LIKE ?)"
		searchPattern := "%" + search + "%"
		countArgs = append(countArgs, searchPattern, searchPattern)
	}

	var total int
	err := db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Database error",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Get products
	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := db.Query(query, args...)
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

	products := []models.Product{}
	for rows.Next() {
		var p models.Product
		err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.CategoryID,
			&p.VendorID, &p.Status, &p.StockQuantity, &p.SKU, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			continue
		}
		products = append(products, p)
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.ListResponse{
			Data: products,
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

// GetProduct gets a single product by ID
func GetProduct(c *gin.Context) {
	productID := c.Param("id")

	db := database.GetDB()
	var product models.Product
	err := db.QueryRow(`
		SELECT id, name, description, price, category_id, vendor_id, status, stock_quantity, sku, created_at, updated_at
		FROM products WHERE id = ?
	`, productID).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price, &product.CategoryID,
		&product.VendorID, &product.Status, &product.StockQuantity, &product.SKU,
		&product.CreatedAt, &product.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success:   false,
			Error:     "Product not found",
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

	// Get variants
	rows, err := db.Query(`
		SELECT id, product_id, name, value, price_modifier, stock_quantity, sku, created_at, updated_at
		FROM product_variants WHERE product_id = ?
	`, productID)
	if err == nil {
		defer rows.Close()
		variants := []models.ProductVariant{}
		for rows.Next() {
			var v models.ProductVariant
			if err := rows.Scan(&v.ID, &v.ProductID, &v.Name, &v.Value, &v.PriceModifier,
				&v.StockQuantity, &v.SKU, &v.CreatedAt, &v.UpdatedAt); err == nil {
				variants = append(variants, v)
			}
		}

		c.JSON(http.StatusOK, models.APIResponse{
			Success: true,
			Data: gin.H{
				"product":  product,
				"variants": variants,
			},
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      product,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// CreateProduct creates a new product
func CreateProduct(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Price       float64 `json:"price" binding:"required,gt=0"`
		CategoryID  string  `json:"category_id" binding:"required"`
		SKU         string  `json:"sku" binding:"required"`
		Stock       int     `json:"stock_quantity"`
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
	productID := utils.GenerateID()
	now := time.Now().Format(time.RFC3339)

	_, err := db.Exec(`
		INSERT INTO products (id, name, description, price, category_id, status, stock_quantity, sku, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, productID, req.Name, req.Description, req.Price, req.CategoryID, "active", req.Stock, req.SKU, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to create product",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	product := models.Product{
		ID:            productID,
		Name:          req.Name,
		Description:   req.Description,
		Price:         req.Price,
		CategoryID:    req.CategoryID,
		Status:        "active",
		StockQuantity: req.Stock,
		SKU:           req.SKU,
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success:   true,
		Data:      product,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// ListCategories lists all categories
func ListCategories(c *gin.Context) {
	db := database.GetDB()

	rows, err := db.Query(`
		SELECT id, name, description, parent_id, image_url, created_at, updated_at
		FROM categories
	`)
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

	categories := []models.Category{}
	for rows.Next() {
		var cat models.Category
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Description, &cat.ParentID,
			&cat.ImageURL, &cat.CreatedAt, &cat.UpdatedAt)
		if err != nil {
			continue
		}
		categories = append(categories, cat)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success:   true,
		Data:      categories,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// CreateCategory creates a new category
func CreateCategory(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Description *string `json:"description"`
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
	categoryID := utils.GenerateID()
	now := time.Now().Format(time.RFC3339)

	_, err := db.Exec(`
		INSERT INTO categories (id, name, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`, categoryID, req.Name, req.Description, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success:   false,
			Error:     "Failed to create category",
			Code:      "INTERNAL_ERROR",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	category := models.Category{
		ID:          categoryID,
		Name:        req.Name,
		Description: req.Description,
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success:   true,
		Data:      category,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}
