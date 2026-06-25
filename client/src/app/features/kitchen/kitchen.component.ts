import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { IngredientService } from '../../services/ingredient.service';
import {
  IOrderIngredientCheck,
  OrderService,
} from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { IIngredient } from '../../core/models/ingredient.model';
import { IOrder } from '../../core/models/order.model';
import { IngredientStatus, OrderStatus } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenComponent {
  private readonly ingredientService = inject(IngredientService);
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);

  readonly IngredientStatus = IngredientStatus;
  readonly OrderStatus = OrderStatus;

  readonly ingredients = signal<IIngredient[]>([]);
  readonly orders = signal<IOrder[]>([]);
  readonly orderChecks = signal<Record<string, IOrderIngredientCheck>>({});
  readonly isLoadingIngredients = signal(true);
  readonly isLoadingOrders = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly updatingIngredientId = signal<string | null>(null);
  readonly reportingIngredientId = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.loadAll();
    });
  }

  async loadAll(): Promise<void> {
    await this.auth.ensureSessionInitialized();
    await Promise.all([this.loadIngredients(), this.loadOrders()]);
  }

  async loadIngredients(): Promise<void> {
    this.isLoadingIngredients.set(true);
    this.errorMessage.set(null);

    try {
      const items = await this.ingredientService.getAll();
      this.ingredients.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load ingredients.'));
    } finally {
      this.isLoadingIngredients.set(false);
    }
  }

  async loadOrders(): Promise<void> {
    this.isLoadingOrders.set(true);

    try {
      const items = await this.orderService.getKitchenOrders();
      this.orders.set(items);

      const checks: Record<string, IOrderIngredientCheck> = {};
      await Promise.all(
        items.map(async (order) => {
          checks[order._id] = await this.orderService.checkOrderIngredients(order._id);
        })
      );
      this.orderChecks.set(checks);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load kitchen orders.'));
    } finally {
      this.isLoadingOrders.set(false);
    }
  }

  statusLabel(status: IngredientStatus): string {
    return status === IngredientStatus.AVAILABLE ? 'Available' : 'Unavailable';
  }

  getOrderCheck(orderId: string): IOrderIngredientCheck | null {
    return this.orderChecks()[orderId] ?? null;
  }

  formatMissingNames(items: { name: string }[]): string {
    return items.map((item) => item.name).join(', ');
  }

  async toggleIngredientStatus(ingredient: IIngredient): Promise<void> {
    const nextStatus =
      ingredient.status === IngredientStatus.AVAILABLE
        ? IngredientStatus.TEMPORARILY_UNAVAILABLE
        : IngredientStatus.AVAILABLE;

    this.updatingIngredientId.set(ingredient.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.ingredientService.setStatus(ingredient.id, nextStatus);
      this.successMessage.set(
        nextStatus === IngredientStatus.TEMPORARILY_UNAVAILABLE
          ? `"${ingredient.name}" marked unavailable. Related base products were disabled.`
          : `"${ingredient.name}" marked available again.`,
      );
      await this.loadAll();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update ingredient status.'));
    } finally {
      this.updatingIngredientId.set(null);
    }
  }

  async reportShortage(ingredient: IIngredient): Promise<void> {
    const message = prompt(
      `Notify the manager about "${ingredient.name}" shortage (optional message):`,
      `${ingredient.name} is missing or running low.`,
    );

    if (message === null) {
      return;
    }

    this.reportingIngredientId.set(ingredient.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.ingredientService.reportShortage(ingredient.id, {
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      this.successMessage.set(`Manager notified about "${ingredient.name}".`);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to notify manager.'));
    } finally {
      this.reportingIngredientId.set(null);
    }
  }

  async approveOrder(order: IOrder): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.orderService.updateStatus(order._id, { status: OrderStatus.APPROVED });
      this.successMessage.set(`Order #${order._id.slice(-6)} approved.`);
      await this.loadOrders();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to approve order.'));
    }
  }
}
