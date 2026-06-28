export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  KITCHEN = 'KITCHEN',
  DELIVERY = 'DELIVERY',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  APPROVED = 'APPROVED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export enum IngredientStatus {
  AVAILABLE = 'AVAILABLE',
  TEMPORARILY_UNAVAILABLE = 'TEMPORARILY_UNAVAILABLE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum ReviewType {
  STORE = 'STORE',
  PRODUCT = 'PRODUCT',
}
