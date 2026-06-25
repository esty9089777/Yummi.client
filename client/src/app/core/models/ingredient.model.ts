import { IngredientStatus } from './enums';

export interface IIngredient {
  id: string;
  name: string;
  status: IngredientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IIngredientUsage {
  baseProductCount: number;
  extraProductCount: number;
}

export interface IIngredientWithUsage extends IIngredient {
  usage: IIngredientUsage;
}

export interface ICreateIngredientDto {
  name: string;
  status?: IngredientStatus;
}

export interface IUpdateIngredientDto {
  name: string;
}

export interface ISetIngredientStatusDto {
  status: IngredientStatus;
}

export interface IReportShortageDto {
  message?: string;
}

export interface IIngredientResponse {
  ingredient: IIngredient | IIngredientWithUsage;
}

export interface IIngredientsResponse {
  ingredients: (IIngredient | IIngredientWithUsage)[];
}
