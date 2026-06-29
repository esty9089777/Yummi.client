import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import { IngredientStatus } from '../core/models/enums';
import {
  ICreateIngredientDto,
  IIngredient,
  IIngredientResponse,
  IIngredientsResponse,
  IReportShortageDto,
  IReplenishIngredientDto,
  IUpdateIngredientDto,
} from '../core/models/ingredient.model';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly api = inject(ApiService);

  async getAll(): Promise<IIngredient[]> {
    const res = await this.api.http.get<ApiResponse<IIngredientsResponse>>('/ingredients');
    const { ingredients } = this.api.unwrap(res);
    return ingredients ?? [];
  }

  async getById(id: string): Promise<IIngredient> {
    const res = await this.api.http.get<ApiResponse<IIngredientResponse>>(`/ingredients/${id}`);
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async create(dto: ICreateIngredientDto): Promise<IIngredient> {
    const res = await this.api.http.post<ApiResponse<IIngredientResponse>>('/ingredients', dto);
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async update(id: string, dto: IUpdateIngredientDto): Promise<IIngredient> {
    const res = await this.api.http.patch<ApiResponse<IIngredientResponse>>(
      `/ingredients/${id}`,
      dto,
    );
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async setStatus(id: string, status: IngredientStatus): Promise<IIngredient> {
    const res = await this.api.http.patch<ApiResponse<IIngredientResponse>>(
      `/ingredients/${id}/status`,
      { status },
    );
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async reportShortage(id: string, dto: IReportShortageDto = {}): Promise<IIngredient> {
    const res = await this.api.http.post<ApiResponse<IIngredientResponse>>(
      `/ingredients/${id}/report-shortage`,
      dto,
    );
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async replenish(id: string, dto: IReplenishIngredientDto = {}): Promise<IIngredient> {
    const res = await this.api.http.post<ApiResponse<IIngredientResponse>>(
      `/ingredients/${id}/replenish`,
      dto,
    );
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }

  async delete(id: string): Promise<IIngredient> {
    const res = await this.api.http.delete<ApiResponse<IIngredientResponse>>(`/ingredients/${id}`);
    const { ingredient } = this.api.unwrap(res);
    return ingredient;
  }
}
