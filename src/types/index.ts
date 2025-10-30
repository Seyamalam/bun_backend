/**
 * Type Definitions for E-Commerce Backend
 */

// ==================== User Types ====================
export type UserRole = 'admin' | 'customer' | 'vendor';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Product Types ====================
export type ProductStatus = 'active' | 'inactive' | 'archived';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  vendor_id?: string;
  status: ProductStatus;
  stock_quantity: number;
  sku: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  name: string;
  value: string;
  created_at: string;
}

// ==================== Cart Types ====================
export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// ==================== Order Types ====================
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// ==================== Payment Types ====================
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodRecord {
  id: string;
  user_id: string;
  method_type: PaymentMethod;
  last_four?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Coupon Types ====================
export type DiscountType = 'percentage' | 'fixed_amount';

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number;
  uses_count: number;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Inventory Types ====================
export interface InventoryHistory {
  id: string;
  product_id: string;
  quantity_changed: number;
  reason: string;
  created_at: string;
}

// ==================== Review Types ====================
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  title: string;
  description: string;
  rating: number;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ==================== Shipping Types ====================
export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  base_cost: number;
  estimated_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Vendor Types ====================
export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_registration?: string;
  commission_rate: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Notification Types ====================
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Audit Log Types ====================
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: string;
  ip_address: string;
  created_at: string;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

// ==================== Request Types ====================
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface AddAddressRequest {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  sku: string;
  status?: ProductStatus;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category_id?: string;
  stock_quantity?: number;
  status?: ProductStatus;
}

export interface AddToCartRequest {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CreateOrderRequest {
  shipping_address_id: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
}

export interface CreateCouponRequest {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number;
  expiry_date: string;
}

export interface SubmitReviewRequest {
  title: string;
  description: string;
  rating: number;
}

// ==================== JWT Payload ====================
export interface JwtPayload {
  user_id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ==================== Request Context ====================
export interface RequestContext {
  user?: UserProfile;
  params: Record<string, string>;
  query: Record<string, string>;
}
