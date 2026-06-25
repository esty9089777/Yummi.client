import {
  ChangeDetectionStrategy,
  Component,
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
import { OrderService } from '../../services/order.service';
import { IOrder } from '../../core/models/order.model';
import { OrderStatus, OrderType } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

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
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
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
}
