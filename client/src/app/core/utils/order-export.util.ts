import { IOrder } from '../models/order.model';
import { OrderStatus } from '../models/enums';
import { downloadCsv } from './csv-export.util';

function formatOrderItems(order: IOrder): string {
  return order.items
    .map((item) => `${item.name} x${item.quantity}`)
    .join('; ');
}

export function exportOrdersCsv(orders: IOrder[], filename = 'orders.csv'): void {
  downloadCsv(filename, [
    ['Order ID', 'Status', 'Type', 'Total', 'Items', 'Created At'],
    ...orders.map((order) => [
      order._id,
      order.status,
      order.orderType,
      order.total.toFixed(2),
      formatOrderItems(order),
      order.createdAt,
    ]),
  ]);
}

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.RECEIVED]: 'Received',
    [OrderStatus.APPROVED]: 'Approved',
    [OrderStatus.IN_PREPARATION]: 'In Preparation',
    [OrderStatus.READY]: 'Ready',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.CANCELLED]: 'Cancelled',
  };
  return labels[status] ?? status;
}
