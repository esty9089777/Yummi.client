import { IIngredient } from '../models/ingredient.model';
import { downloadCsv } from './csv-export.util';

export function exportIngredientsCsv(ingredients: IIngredient[], filename = 'ingredients.csv'): void {
  downloadCsv(filename, [
    ['ID', 'Name', 'Status', 'Updated At'],
    ...ingredients.map((ingredient) => [
      ingredient.id,
      ingredient.name,
      ingredient.status,
      ingredient.updatedAt,
    ]),
  ]);
}
