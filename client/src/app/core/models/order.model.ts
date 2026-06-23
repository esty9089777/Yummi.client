import { OrderStatus, OrderType, PaymentStatus } from './enums';

export interface IOrderExtraSnapshot {
  ingredientId: string;
  name: string;
  price: number;
}

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedExtras: IOrderExtraSnapshot[];
  totalPrice: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  deliveryAddress?: string;
  deliveryCity?: string;
  estimatedDeliveryMinutes?: number;
  estimatedDeliveryTime?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
