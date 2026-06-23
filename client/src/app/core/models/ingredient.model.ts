import { IngredientStatus } from './enums';

export interface IIngredient {
  _id: string;
  name: string;
  status: IngredientStatus;
  createdAt: string;
  updatedAt: string;
}
