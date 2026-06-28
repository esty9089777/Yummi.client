import { IngredientStatus } from './enums';

/**
 * Cart shapes returned by the server.
 *
 * The cart endpoints return the raw Mongoose document with `items.productId`
 * and `items.selectedExtras` populated, so those nested entities expose `_id`
 * (unlike the catalog DTOs which expose `id`).
 */

/** Product snapshot embedded in a populated cart line. */
export interface ICartProduct {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  allowedExtras: string[];
  freeExtrasCount: number;
  pricePerExtra: number;
  isAvailable: boolean;
}

/** Ingredient (add-on) snapshot embedded in a populated cart line. */
export interface ICartExtra {
  _id: string;
  name: string;
  status: IngredientStatus;
}

/** A single populated cart line (product + chosen add-ons + quantity). */
export interface ICartItem {
  _id: string;
  productId: ICartProduct;
  quantity: number;
  selectedExtras: ICartExtra[];
}

/** The user's full populated cart, as returned by `GET /cart`. */
export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ICartResponse {
  cart: ICart;
}

export interface IAddCartItemDto {
  productId: string;
  quantity?: number;
  selectedExtras?: string[];
}

export interface IUpdateCartItemDto {
  quantity: number;
  /** Identifies the line when the same product appears with different add-ons. */
  selectedExtras?: string[];
}
