export interface INotification {
  _id: string;
  recipient: string;
  type: string;
  message: string;
  data?: { orderId?: string; ingredientId?: string; ingredientName?: string; [key: string]: unknown };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
