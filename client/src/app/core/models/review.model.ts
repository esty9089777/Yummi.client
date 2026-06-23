export interface IReview {
  _id: string;
  order: string;
  customer: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
