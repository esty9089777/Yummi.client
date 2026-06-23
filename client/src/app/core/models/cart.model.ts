export interface ICartItem {
  productId: string;
  quantity: number;
  selectedExtras: string[];
}

export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
  createdAt: string;
  updatedAt: string;
}
