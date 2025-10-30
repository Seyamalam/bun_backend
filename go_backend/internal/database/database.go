package database

import (
	"database/sql"
	"fmt"
	"log"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var (
	db   *sql.DB
	once sync.Once
)

// GetDB returns a singleton database connection
func GetDB() *sql.DB {
	once.Do(func() {
		var err error
		db, err = sql.Open("sqlite3", "./ecommerce.db?_journal_mode=WAL&_foreign_keys=ON")
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		if err = db.Ping(); err != nil {
			log.Fatal("Failed to ping database:", err)
		}

		// Set connection pool settings
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(5)

		// Initialize schema
		if err = initSchema(); err != nil {
			log.Fatal("Failed to initialize schema:", err)
		}

		log.Println("Database connected and initialized")
	})
	return db
}

// Close closes the database connection
func Close() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

func initSchema() error {
	schemas := []string{
		createUserTables(),
		createProductTables(),
		createCartTables(),
		createOrderTables(),
		createPaymentTables(),
		createCouponTables(),
		createInventoryTables(),
		createReviewTables(),
		createShippingTables(),
		createVendorTables(),
		createNotificationTables(),
		createAuditLogTables(),
		createVerificationTokenTables(),
	}

	for _, schema := range schemas {
		if _, err := db.Exec(schema); err != nil {
			return fmt.Errorf("failed to execute schema: %w", err)
		}
	}

	return nil
}

func createUserTables() string {
	return `
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	phone TEXT,
	role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin', 'customer', 'vendor')),
	is_active BOOLEAN NOT NULL DEFAULT 1,
	email_verified BOOLEAN NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	role TEXT NOT NULL,
	assigned_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	street_address TEXT NOT NULL,
	city TEXT NOT NULL,
	state TEXT NOT NULL,
	postal_code TEXT NOT NULL,
	country TEXT NOT NULL,
	is_default BOOLEAN NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
`
}

func createProductTables() string {
	return `
CREATE TABLE IF NOT EXISTS categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	description TEXT,
	parent_id TEXT,
	image_url TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	price REAL NOT NULL CHECK(price >= 0),
	category_id TEXT NOT NULL,
	vendor_id TEXT,
	status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
	stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
	sku TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
	FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	name TEXT NOT NULL,
	value TEXT NOT NULL,
	price_modifier REAL NOT NULL DEFAULT 0,
	stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
	sku TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_attributes (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	name TEXT NOT NULL,
	value TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
`
}

func createCartTables() string {
	return `
CREATE TABLE IF NOT EXISTS carts (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
	id TEXT PRIMARY KEY,
	cart_id TEXT NOT NULL,
	product_id TEXT NOT NULL,
	variant_id TEXT,
	quantity INTEGER NOT NULL CHECK(quantity > 0),
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
	FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
`
}

func createOrderTables() string {
	return `
CREATE TABLE IF NOT EXISTS orders (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
	total_amount REAL NOT NULL CHECK(total_amount >= 0),
	shipping_address_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
	FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
	id TEXT PRIMARY KEY,
	order_id TEXT NOT NULL,
	product_id TEXT NOT NULL,
	variant_id TEXT,
	quantity INTEGER NOT NULL CHECK(quantity > 0),
	unit_price REAL NOT NULL CHECK(unit_price >= 0),
	total_price REAL NOT NULL CHECK(total_price >= 0),
	created_at TEXT NOT NULL,
	FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
	FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
`
}

func createPaymentTables() string {
	return `
CREATE TABLE IF NOT EXISTS payments (
	id TEXT PRIMARY KEY,
	order_id TEXT NOT NULL UNIQUE,
	user_id TEXT NOT NULL,
	amount REAL NOT NULL CHECK(amount >= 0),
	status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
	method TEXT NOT NULL CHECK(method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')),
	transaction_id TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payment_methods (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	method_type TEXT NOT NULL CHECK(method_type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')),
	last_four TEXT,
	is_default BOOLEAN NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
`
}

func createCouponTables() string {
	return `
CREATE TABLE IF NOT EXISTS coupons (
	id TEXT PRIMARY KEY,
	code TEXT NOT NULL UNIQUE,
	discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount')),
	discount_value REAL NOT NULL CHECK(discount_value > 0),
	min_purchase_amount REAL NOT NULL DEFAULT 0 CHECK(min_purchase_amount >= 0),
	max_uses INTEGER NOT NULL DEFAULT -1,
	uses_count INTEGER NOT NULL DEFAULT 0,
	expiry_date TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_usage (
	id TEXT PRIMARY KEY,
	coupon_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	order_id TEXT,
	discount_amount REAL NOT NULL,
	used_at TEXT NOT NULL,
	FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
`
}

func createInventoryTables() string {
	return `
CREATE TABLE IF NOT EXISTS inventory_history (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	quantity_changed INTEGER NOT NULL,
	reason TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
`
}

func createReviewTables() string {
	return `
CREATE TABLE IF NOT EXISTS reviews (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
	is_approved BOOLEAN NOT NULL DEFAULT 0,
	helpful_count INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_helpful (
	id TEXT PRIMARY KEY,
	review_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	UNIQUE(review_id, user_id),
	FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
`
}

func createShippingTables() string {
	return `
CREATE TABLE IF NOT EXISTS shipping_methods (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	description TEXT,
	base_cost REAL NOT NULL CHECK(base_cost >= 0),
	estimated_days INTEGER NOT NULL CHECK(estimated_days > 0),
	is_active BOOLEAN NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_shipping (
	id TEXT PRIMARY KEY,
	order_id TEXT NOT NULL UNIQUE,
	shipping_method_id TEXT NOT NULL,
	tracking_number TEXT,
	status TEXT NOT NULL DEFAULT 'pending',
	estimated_delivery TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
	FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_shipping_order_id ON order_shipping(order_id);
`
}

func createVendorTables() string {
	return `
CREATE TABLE IF NOT EXISTS vendors (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	business_name TEXT NOT NULL,
	business_registration TEXT,
	commission_rate REAL NOT NULL DEFAULT 0.10 CHECK(commission_rate >= 0 AND commission_rate <= 1),
	is_verified BOOLEAN NOT NULL DEFAULT 0,
	is_active BOOLEAN NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_payouts (
	id TEXT PRIMARY KEY,
	vendor_id TEXT NOT NULL,
	amount REAL NOT NULL CHECK(amount > 0),
	status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
	payout_date TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
`
}

func createNotificationTables() string {
	return `
CREATE TABLE IF NOT EXISTS notifications (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	type TEXT NOT NULL,
	title TEXT NOT NULL,
	message TEXT NOT NULL,
	is_read BOOLEAN NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`
}

func createAuditLogTables() string {
	return `
CREATE TABLE IF NOT EXISTS audit_logs (
	id TEXT PRIMARY KEY,
	user_id TEXT,
	action TEXT NOT NULL,
	entity_type TEXT NOT NULL,
	entity_id TEXT NOT NULL,
	changes TEXT,
	ip_address TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
`
}

func createVerificationTokenTables() string {
	return `
CREATE TABLE IF NOT EXISTS verification_tokens (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	token TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL CHECK(type IN ('email_verification', 'password_reset')),
	expires_at TEXT NOT NULL,
	used BOOLEAN NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);
`
}
