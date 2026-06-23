import { ICategory } from './category.model';
import { IIngredient } from './ingredient.model';

export interface IProduct {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  categories: ICategory[] | string[];
  ingredients: IIngredient[] | string[];
  allowedExtras: IIngredient[] | string[];
  freeExtrasCount: number;
  pricePerExtra: number;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
