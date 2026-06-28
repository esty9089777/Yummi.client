import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { SocketService, SocketEvents } from '../../core/services/socket.service';
import { IOrder } from '../../core/models/order.model';
import { OrderStatus, OrderType } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryComponent implements OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);

  readonly OrderType = OrderType;
  readonly OrderStatus = OrderStatus;

  readonly orders = signal<IOrder[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly completingOrderId = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.auth.ensureSessionInitialized().then(() => {
        void this.load().then(() => this._registerSocketListeners());
      });
    });
  }

  ngOnDestroy(): void {
    this.socketService.off(SocketEvents.ORDER_READY);
    this.socketService.off(SocketEvents.ORDER_COMPLETED);
    this.socketService.off(SocketEvents.ORDER_CANCELLED);
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const items = await this.orderService.getDeliveryOrders();
      this.orders.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load delivery orders.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async markCompleted(order: IOrder): Promise<void> {
    this.completingOrderId.set(order._id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.orderService.updateStatus(order._id, { status: OrderStatus.COMPLETED });
      this.orders.update((list) => list.filter((o) => o._id !== order._id));
      this.successMessage.set(
        `Order #${order._id.slice(-6).toUpperCase()} marked as completed.`
      );
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to complete order.'));
    } finally {
      this.completingOrderId.set(null);
    }
  }

  orderTypeLabel(type: OrderType): string {
    return type === OrderType.DELIVERY ? 'Delivery' : 'Pickup';
  }

  orderTypeIcon(type: OrderType): string {
    return type === OrderType.DELIVERY ? 'delivery_dining' : 'store';
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }

  private _registerSocketListeners(): void {
    // New order is READY — add it to the delivery queue.
    this.socketService.on<IOrder>(SocketEvents.ORDER_READY, (readyOrder) => {
      const already = this.orders().some((o) => o._id === readyOrder._id);
      if (!already) {
        this.orders.update((list) => [...list, readyOrder]);
      }

      this.snackBar.open(
        `Order #${readyOrder._id.slice(-6).toUpperCase()} is ready for ${this.orderTypeLabel(readyOrder.orderType).toLowerCase()}!`,
        'Dismiss',
        { duration: 6000, panelClass: 'snack-info', horizontalPosition: 'end', verticalPosition: 'top' },
      );
    });

    // Order completed (possibly by another session) — remove from list.
    this.socketService.on<IOrder>(SocketEvents.ORDER_COMPLETED, (completedOrder) => {
      this.orders.update((list) => list.filter((o) => o._id !== completedOrder._id));
    });

    // Customer cancelled — remove from list.
    this.socketService.on<IOrder>(SocketEvents.ORDER_CANCELLED, (cancelledOrder) => {
      this.orders.update((list) => list.filter((o) => o._id !== cancelledOrder._id));
      this.snackBar.open(
        `Order #${cancelledOrder._id.slice(-6).toUpperCase()} was cancelled.`,
        'Dismiss',
        { duration: 5000, panelClass: 'snack-warn', horizontalPosition: 'end', verticalPosition: 'top' },
      );
    });
  }
}
