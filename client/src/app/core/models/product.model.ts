import { IngredientStatus } from './enums';

export interface IIngredientSummary {
  id: string;
  name: string;
  status: IngredientStatus;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  /** Array of category IDs */
  categories: string[];
  /** Array of ingredient IDs */
  ingredients: string[];
  /** Array of ingredient IDs that can be added as extras */
  allowedExtras: string[];
  freeExtrasCount: number;
  pricePerExtra: number;
  isAvailable: boolean;
  baseIngredients?: IIngredientSummary[];
  extraIngredients?: IIngredientSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface IProductResponse {
  product: IProduct;
}

export interface IProductsResponse {
  products: IProduct[];
}
