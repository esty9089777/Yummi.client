import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  ICategoriesResponse,
  ICategory,
  ICategoryResponse,
  ICreateCategoryDto,
  IUpdateCategoryDto,
} from '../core/models/category.model';
import { IProduct, IProductsResponse } from '../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  async getAll(): Promise<ICategory[]> {
    const res = await this.api.http.get<ApiResponse<ICategoriesResponse>>('/categories');
    const { categories } = this.api.unwrap(res);
    return categories;
  }

  async getById(id: string): Promise<ICategory> {
    const res = await this.api.http.get<ApiResponse<ICategoryResponse>>(`/categories/${id}`);
    const { category } = this.api.unwrap(res);
    return category;
  }

  async listProducts(categoryId: string): Promise<IProduct[]> {
    const res = await this.api.http.get<ApiResponse<IProductsResponse>>(
      `/categories/${categoryId}/products`,
    );
    const { products } = this.api.unwrap(res);
    return products ?? [];
  }

  async create(dto: ICreateCategoryDto): Promise<ICategory> {
    const res = await this.api.http.post<ApiResponse<ICategoryResponse>>('/categories', dto);
    const { category } = this.api.unwrap(res);
    return category;
  }

  async update(id: string, dto: IUpdateCategoryDto): Promise<ICategory> {
    const res = await this.api.http.patch<ApiResponse<ICategoryResponse>>(
      `/categories/${id}`,
      dto,
    );
    const { category } = this.api.unwrap(res);
    return category;
  }

  async delete(id: string): Promise<ICategory> {
    const res = await this.api.http.delete<ApiResponse<ICategoryResponse>>(`/categories/${id}`);
    const { category } = this.api.unwrap(res);
    return category;
  }
}
