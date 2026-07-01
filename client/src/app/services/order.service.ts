import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import { ICreateOrderDto, IOrder } from '../core/models/order.model';
import { OrderStatus } from '../core/models/enums';

export interface IOrdersResponse {
  orders: IOrder[];
}

export interface IOrderResponse {
  order: IOrder;
}

export interface IMissingIngredientSummary {
  id: string;
  name: string;
}

export interface IOrderIngredientCheckItem {
  productId: string;
  productName: string;
  quantity: number;
  missingBaseIngredients: IMissingIngredientSummary[];
  missingSelectedExtras: IMissingIngredientSummary[];
  canPrepare: boolean;
}

export interface IOrderIngredientCheck {
  orderId: string;
  canPrepareOrder: boolean;
  items: IOrderIngredientCheckItem[];
}

export interface IOrderIngredientCheckResponse {
  check: IOrderIngredientCheck;
}

export interface IUpdateOrderStatusDto {
  status: OrderStatus;
}

export interface ICancelOrderDto {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  /** Places a new order from the current cart. Returns the created order. */
  async createOrder(dto: ICreateOrderDto): Promise<IOrder> {
    const res = await this.api.http.post<ApiResponse<IOrderResponse>>('/orders', dto);
    const { order } = this.api.unwrap(res);
    return order;
  }

  /** Returns orders that are READY and waiting for pickup/delivery (delivery workers). */
  async getDeliveryOrders(): Promise<IOrder[]> {
    const res = await this.api.http.get<ApiResponse<IOrdersResponse>>('/orders/delivery');
    const { orders } = this.api.unwrap(res);
    return orders ?? [];
  }

  /** Returns the authenticated user's own orders, newest first. */
  async getMyOrders(): Promise<IOrder[]> {
    const res = await this.api.http.get<ApiResponse<IOrdersResponse>>('/orders/my');
    const { orders } = this.api.unwrap(res);
    return orders ?? [];
  }

  async cancelOrder(orderId: string, dto: ICancelOrderDto): Promise<IOrder> {
    const res = await this.api.http.post<ApiResponse<IOrderResponse>>(
      `/orders/${orderId}/cancel`,
      dto,
    );
    const { order } = this.api.unwrap(res);
    return order;
  }

  async getKitchenOrders(): Promise<IOrder[]> {
    const res = await this.api.http.get<ApiResponse<IOrdersResponse>>('/orders/kitchen');
    const { orders } = this.api.unwrap(res);
    return orders ?? [];
  }

  /** Returns all orders (manager / employee view). */
  async getAllOrders(): Promise<IOrder[]> {
    const res = await this.api.http.get<ApiResponse<IOrdersResponse>>('/orders');
    const { orders } = this.api.unwrap(res);
    return orders ?? [];
  }

  async checkOrderIngredients(orderId: string): Promise<IOrderIngredientCheck> {
    const res = await this.api.http.get<ApiResponse<IOrderIngredientCheckResponse>>(
      `/orders/${orderId}/ingredient-check`,
    );
    const { check } = this.api.unwrap(res);
    return check;
  }

  async updateStatus(orderId: string, dto: IUpdateOrderStatusDto): Promise<IOrder> {
    const res = await this.api.http.patch<ApiResponse<IOrderResponse>>(
      `/orders/${orderId}/status`,
      dto,
    );
    const { order } = this.api.unwrap(res);
    return order;
  }
}
