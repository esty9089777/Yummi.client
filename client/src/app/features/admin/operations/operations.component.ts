import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { OrderService } from '../../../services/order.service';
import { IngredientService } from '../../../services/ingredient.service';
import { IOrder } from '../../../core/models/order.model';
import { IIngredient } from '../../../core/models/ingredient.model';
import { IngredientStatus, OrderStatus } from '../../../core/models/enums';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { exportOrdersCsv, orderStatusLabel } from '../../../core/utils/order-export.util';
import { exportIngredientsCsv } from '../../../core/utils/ingredient-export.util';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './operations.component.html',
  styleUrl: './operations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly ingredientService = inject(IngredientService);

  readonly OrderStatus = OrderStatus;
  readonly IngredientStatus = IngredientStatus;

  readonly orders = signal<IOrder[]>([]);
  readonly ingredients = signal<IIngredient[]>([]);
  readonly isLoadingOrders = signal(true);
  readonly isLoadingIngredients = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly orderColumns = ['id', 'status', 'type', 'total', 'items', 'createdAt'];
  readonly ingredientColumns = ['name', 'status', 'updatedAt'];

  ngOnInit(): void {
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.errorMessage.set(null);
    await Promise.all([this.loadOrders(), this.loadIngredients()]);
  }

  async loadOrders(): Promise<void> {
    this.isLoadingOrders.set(true);
    try {
      this.orders.set(await this.orderService.getAllOrders());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load orders.'));
    } finally {
      this.isLoadingOrders.set(false);
    }
  }

  async loadIngredients(): Promise<void> {
    this.isLoadingIngredients.set(true);
    try {
      this.ingredients.set(await this.ingredientService.getAll());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load ingredients.'));
    } finally {
      this.isLoadingIngredients.set(false);
    }
  }

  shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  statusLabel(status: OrderStatus): string {
    return orderStatusLabel(status);
  }

  ingredientStatusLabel(status: IngredientStatus): string {
    return status === IngredientStatus.AVAILABLE ? 'Available' : 'Unavailable';
  }

  itemSummary(order: IOrder): string {
    return order.items.map((item) => `${item.name} x${item.quantity}`).join(', ');
  }

  downloadOrders(): void {
    exportOrdersCsv(this.orders(), `yummi-orders-${Date.now()}.csv`);
  }

  downloadIngredients(): void {
    exportIngredientsCsv(this.ingredients(), `yummi-ingredients-${Date.now()}.csv`);
  }
}
