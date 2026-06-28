import { ReviewType } from './enums';

export interface IReview {
  id: string;
  type: ReviewType;
  title: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface ICreateReviewDto {
  type: ReviewType;
  title: string;
  rating: number;
  comment: string;
  orderId?: string;
  productId?: string;
}

export interface IReviewsResponse {
  reviews: IReview[];
}

export interface IReviewResponse {
  review: IReview;
}
