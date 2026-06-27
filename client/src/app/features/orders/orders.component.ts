import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../services/order.service';
import { SocketService, SocketEvents } from '../../core/services/socket.service';
import { IOrder } from '../../core/models/order.model';
import { OrderStatus, OrderType } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

/** Human-readable label for each terminal order status change. */
const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.APPROVED]: 'Your order has been approved!',
  [OrderStatus.IN_PREPARATION]: 'Your order is being prepared.',
  [OrderStatus.READY]: 'Your order is ready for pickup / delivery!',
  [OrderStatus.COMPLETED]: 'Your order has been completed.',
  [OrderStatus.CANCELLED]: 'Your order was cancelled.',
};

/** Socket events that carry a full IOrder payload. */
const ORDER_STATUS_EVENTS = [
  SocketEvents.ORDER_APPROVED,
  SocketEvents.ORDER_IN_PREPARATION,
  SocketEvents.ORDER_READY,
  SocketEvents.ORDER_COMPLETED,
  SocketEvents.ORDER_CANCELLED,
] as const;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly socketService = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  readonly OrderStatus = OrderStatus;
  readonly OrderType = OrderType;

  readonly orders = signal<IOrder[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly justPlacedId = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.justPlacedId.set(this.route.snapshot.queryParamMap.get('placed'));
    await this.load();
    this._registerSocketListeners();
  }

  ngOnDestroy(): void {
    for (const event of ORDER_STATUS_EVENTS) {
      this.socketService.off(event);
    }
    this.socketService.off(SocketEvents.ORDER_ESTIMATED_TIME_UPDATED);
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.orders.set(await this.orderService.getMyOrders());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load your orders.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async cancel(order: IOrder): Promise<void> {
    const reason = window.prompt('Why are you cancelling this order?')?.trim();
    if (!reason || reason.length < 3) {
      return;
    }

    this.cancellingId.set(order._id);
    this.errorMessage.set(null);
    try {
      const updated = await this.orderService.cancelOrder(order._id, { reason });
      this.orders.update((orders) =>
        orders.map((existing) => (existing._id === updated._id ? updated : existing)),
      );
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Could not cancel the order.'));
    } finally {
      this.cancellingId.set(null);
    }
  }

  canCancel(order: IOrder): boolean {
    return order.status === OrderStatus.RECEIVED;
  }

  statusClass(status: OrderStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }

  shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _registerSocketListeners(): void {
    for (const event of ORDER_STATUS_EVENTS) {
      this.socketService.on<IOrder>(event, (updatedOrder) => {
        this._applyOrderUpdate(updatedOrder);
      });
    }

    this.socketService.on<IOrder>(SocketEvents.ORDER_ESTIMATED_TIME_UPDATED, (updatedOrder) => {
      this._applyOrderUpdate(updatedOrder);
    });
  }

  private _applyOrderUpdate(updatedOrder: IOrder): void {
    const exists = this.orders().some((o) => o._id === updatedOrder._id);

    if (exists) {
      this.orders.update((list) =>
        list.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
    } else {
      // If the order isn't in our list yet (e.g. just placed), prepend it.
      this.orders.update((list) => [updatedOrder, ...list]);
    }

    const message = STATUS_MESSAGES[updatedOrder.status];
    if (message) {
      const panelClass =
        updatedOrder.status === OrderStatus.READY
          ? 'snack-success'
          : updatedOrder.status === OrderStatus.CANCELLED
            ? 'snack-warn'
            : 'snack-info';

      this.snackBar.open(message, 'Dismiss', {
        duration: 5000,
        panelClass,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }
}
