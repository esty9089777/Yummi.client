export interface IReview {
  id: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateReviewDto {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface IReviewsResponse {
  reviews: IReview[];
}

export interface IReviewResponse {
  review: IReview;
}
