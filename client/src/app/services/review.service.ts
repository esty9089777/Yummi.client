import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  ICreateReviewDto,
  IReview,
  IReviewResponse,
  IReviewsResponse,
} from '../core/models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  async create(dto: ICreateReviewDto): Promise<IReview> {
    const res = await this.api.http.post<ApiResponse<IReviewResponse>>('/reviews', dto);
    const { review } = this.api.unwrap(res);
    return review;
  }

  async getStoreReviews(): Promise<IReview[]> {
    const res = await this.api.http.get<ApiResponse<IReviewsResponse>>('/reviews/store');
    const { reviews } = this.api.unwrap(res);
    return reviews ?? [];
  }

  async getProductReviews(productId: string): Promise<IReview[]> {
    const res = await this.api.http.get<ApiResponse<IReviewsResponse>>(
      `/reviews/product/${productId}`,
    );
    const { reviews } = this.api.unwrap(res);
    return reviews ?? [];
  }

  async getAll(): Promise<IReview[]> {
    const res = await this.api.http.get<ApiResponse<IReviewsResponse>>('/reviews');
    const { reviews } = this.api.unwrap(res);
    return reviews ?? [];
  }

  async getById(id: string): Promise<IReview> {
    const res = await this.api.http.get<ApiResponse<IReviewResponse>>(`/reviews/${id}`);
    const { review } = this.api.unwrap(res);
    return review;
  }

  async delete(id: string): Promise<void> {
    await this.api.http.delete('/reviews/' + id);
  }
}
