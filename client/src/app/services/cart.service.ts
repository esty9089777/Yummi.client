import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  IAddCartItemDto,
  ICart,
  ICartItem,
  ICartResponse,
  IUpdateCartItemDto,
} from '../core/models/cart.model';
import { computeLineTotal } from '../core/utils/pricing.util';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);

  private readonly _cart = signal<ICart | null>(null);

  /** Read-only signal: the current user's cart (null until first loaded). */
  readonly cart = this._cart.asReadonly();

  /** Read-only signal: the cart's line items. */
  readonly items = computed<ICartItem[]>(() => this._cart()?.items ?? []);

  /** Total number of units across all lines (for the nav badge). */
  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );

  /** Estimated subtotal computed client-side from the populated cart. */
  readonly subtotal = computed(() =>
    parseFloat(
      this.items()
        .reduce((sum, item) => sum + this.lineTotal(item), 0)
        .toFixed(2),
    ),
  );

  readonly isEmpty = computed(() => this.items().length === 0);

  /** Per-line total including add-ons, mirroring the server pricing rules. */
  lineTotal(item: ICartItem): number {
    const product = item.productId;
    return computeLineTotal(
      product.price ?? 0,
      item.selectedExtras.length,
      item.quantity,
      product.freeExtrasCount ?? 0,
      product.pricePerExtra ?? 0,
    );
  }

  /** Loads the current user's cart and updates local state. */
  async load(): Promise<ICart> {
    const res = await this.api.http.get<ApiResponse<ICartResponse>>('/cart');
    const { cart } = this.api.unwrap(res);
    this._cart.set(cart);
    return cart;
  }

  async addItem(dto: IAddCartItemDto): Promise<ICart> {
    const res = await this.api.http.post<ApiResponse<ICartResponse>>('/cart/items', dto);
    const { cart } = this.api.unwrap(res);
    this._cart.set(cart);
    return cart;
  }

  async updateItem(productId: string, dto: IUpdateCartItemDto): Promise<ICart> {
    const res = await this.api.http.patch<ApiResponse<ICartResponse>>(
      `/cart/items/${productId}`,
      dto,
    );
    const { cart } = this.api.unwrap(res);
    this._cart.set(cart);
    return cart;
  }

  async removeItem(productId: string, selectedExtras: string[] = []): Promise<ICart> {
    const query = selectedExtras.length
      ? `?${selectedExtras.map((id) => `selectedExtras=${encodeURIComponent(id)}`).join('&')}`
      : '';
    const res = await this.api.http.delete<ApiResponse<ICartResponse>>(
      `/cart/items/${productId}${query}`,
    );
    const { cart } = this.api.unwrap(res);
    this._cart.set(cart);
    return cart;
  }

  /** Clears local cart state (e.g. after placing an order or logging out). */
  reset(): void {
    this._cart.set(null);
  }
}
