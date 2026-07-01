import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import { IProduct, IProductResponse, IProductsResponse, ICreateProductDto, IUpdateProductDto } from '../core/models/product.model';

export interface ProductListParams {
  search?: string;
  categoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  async getAll(params?: ProductListParams): Promise<IProduct[]> {
    const query = new URLSearchParams();
    if (params?.search?.trim()) query.set('search', params.search.trim());
    if (params?.categoryId) query.set('categoryId', params.categoryId);

    const url = query.toString() ? `/products?${query.toString()}` : '/products';
    const res = await this.api.http.get<ApiResponse<IProductsResponse>>(url);
    const { products } = this.api.unwrap(res);
    return products ?? [];
  }

  async getById(id: string): Promise<IProduct> {
    const res = await this.api.http.get<ApiResponse<IProductResponse>>(`/products/${id}`);
    const { product } = this.api.unwrap(res);
    return product;
  }

  async create(dto: ICreateProductDto): Promise<IProduct> {
    const res = await this.api.http.post<ApiResponse<IProductResponse>>('/products', dto);
    const { product } = this.api.unwrap(res);
    return product;
  }

  async update(id: string, dto: IUpdateProductDto): Promise<IProduct> {
    const res = await this.api.http.patch<ApiResponse<IProductResponse>>(`/products/${id}`, dto);
    const { product } = this.api.unwrap(res);
    return product;
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<IProduct> {
    const res = await this.api.http.patch<ApiResponse<IProductResponse>>(
      `/products/${id}/availability`,
      { isAvailable },
    );
    const { product } = this.api.unwrap(res);
    return product;
  }
}
