import {
  OnDestroy,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IngredientService } from '../../services/ingredient.service';
import {
  IOrderIngredientCheck,
  OrderService,
} from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { SocketService, SocketEvents } from '../../core/services/socket.service';
import { IIngredient } from '../../core/models/ingredient.model';
import { IOrder } from '../../core/models/order.model';
import { IngredientStatus, OrderStatus } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';
import { exportOrdersCsv } from '../../core/utils/order-export.util';

/**
 * Allowed forward transitions for the kitchen.
 * Kitchen's last action is "Mark Ready" — delivery handles READY → COMPLETED.
 */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.RECEIVED]: OrderStatus.APPROVED,
  [OrderStatus.APPROVED]: OrderStatus.IN_PREPARATION,
  [OrderStatus.IN_PREPARATION]: OrderStatus.READY,
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.RECEIVED]: 'Approve',
  [OrderStatus.APPROVED]: 'Start Preparing',
  [OrderStatus.IN_PREPARATION]: 'Mark Ready',
};

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
    MatSnackBarModule,
  ],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenComponent implements OnDestroy {
  private readonly ingredientService = inject(IngredientService);
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);

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
  readonly updatingOrderId = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.loadAll().then(() => this._registerSocketListeners());
    });
  }

  ngOnDestroy(): void {
    this.socketService.off(SocketEvents.ORDER_CREATED);
    this.socketService.off(SocketEvents.ORDER_APPROVED);
    this.socketService.off(SocketEvents.ORDER_IN_PREPARATION);
    this.socketService.off(SocketEvents.ORDER_READY);
    this.socketService.off(SocketEvents.ORDER_CANCELLED);
    this.socketService.off(SocketEvents.INGREDIENT_AVAILABILITY_CHANGED);
    this.socketService.off(SocketEvents.KITCHEN_ISSUE_REPORTED);
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

  /** Pipeline summary stages shown above the order list (kitchen handles up to IN_PREPARATION). */
  readonly pipelineStages = [
    { status: OrderStatus.RECEIVED, label: 'Received', icon: 'inbox', css: 'received' },
    { status: OrderStatus.APPROVED, label: 'Approved', icon: 'thumb_up', css: 'approved' },
    { status: OrderStatus.IN_PREPARATION, label: 'Preparing', icon: 'soup_kitchen', css: 'preparing' },
  ] as const;

  /** Steps shown inside each order card's stepper. */
  readonly orderSteps = [
    { status: OrderStatus.RECEIVED, label: 'Received', icon: 'inbox' },
    { status: OrderStatus.APPROVED, label: 'Approved', icon: 'thumb_up' },
    { status: OrderStatus.IN_PREPARATION, label: 'Preparing', icon: 'soup_kitchen' },
    { status: OrderStatus.READY, label: 'Ready', icon: 'check_circle' },
    { status: OrderStatus.COMPLETED, label: 'Completed', icon: 'done_all' },
  ] as const;

  private readonly STATUS_ORDER = [
    OrderStatus.RECEIVED,
    OrderStatus.APPROVED,
    OrderStatus.IN_PREPARATION,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
  ];

  countByStatus(status: OrderStatus): number {
    return this.orders().filter((o) => o.status === status).length;
  }

  statusCss(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.RECEIVED]: 'received',
      [OrderStatus.APPROVED]: 'approved',
      [OrderStatus.IN_PREPARATION]: 'preparing',
      [OrderStatus.READY]: 'ready',
      [OrderStatus.COMPLETED]: 'completed',
      [OrderStatus.CANCELLED]: 'cancelled',
    };
    return map[status] ?? status.toLowerCase();
  }

  statusIcon(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.RECEIVED]: 'inbox',
      [OrderStatus.APPROVED]: 'thumb_up',
      [OrderStatus.IN_PREPARATION]: 'soup_kitchen',
      [OrderStatus.READY]: 'check_circle',
      [OrderStatus.COMPLETED]: 'done_all',
      [OrderStatus.CANCELLED]: 'cancel',
    };
    return map[status] ?? 'help_outline';
  }

  isStepDone(currentStatus: OrderStatus, stepStatus: OrderStatus): boolean {
    const currentIdx = this.STATUS_ORDER.indexOf(currentStatus);
    const stepIdx = this.STATUS_ORDER.indexOf(stepStatus);
    return stepIdx < currentIdx;
  }

  /** Label shown on the order status chip. */
  orderStatusLabel(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.RECEIVED]: 'Received',
      [OrderStatus.APPROVED]: 'Approved',
      [OrderStatus.IN_PREPARATION]: 'Preparing',
      [OrderStatus.READY]: 'Ready',
      [OrderStatus.COMPLETED]: 'Completed',
      [OrderStatus.CANCELLED]: 'Cancelled',
    };
    return map[status] ?? status.replaceAll('_', ' ');
  }

  /** Label shown on the ingredient status chip. */
  statusLabel(status: IngredientStatus): string {
    return status === IngredientStatus.AVAILABLE ? 'Available' : 'Unavailable';
  }

  getOrderCheck(orderId: string): IOrderIngredientCheck | null {
    return this.orderChecks()[orderId] ?? null;
  }

  formatMissingNames(items: { name: string }[]): string {
    return items.map((item) => item.name).join(', ');
  }

  downloadOrders(): void {
    exportOrdersCsv(this.orders(), `yummi-kitchen-orders-${Date.now()}.csv`);
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

  /** Returns the next status the kitchen can advance to, or null if no action available. */
  nextStatus(order: IOrder): OrderStatus | null {
    return NEXT_STATUS[order.status] ?? null;
  }

  /** Returns the label for the primary action button for this order. */
  actionLabel(order: IOrder): string {
    return ACTION_LABELS[order.status] ?? '';
  }

  /**
   * Advances an order to the next status in the kitchen workflow.
   * Updates the order in place via socket (the customer sees it in real time);
   * the kitchen list is refreshed locally from the server response.
   */
  async advanceStatus(order: IOrder): Promise<void> {
    const next = this.nextStatus(order);
    if (!next) return;

    this.updatingOrderId.set(order._id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.orderService.updateStatus(order._id, { status: next });

      // When marked READY, the order leaves the kitchen and goes to delivery.
      // For all other transitions, update status in place.
      if (next === OrderStatus.READY) {
        this._removeFromKitchen(order._id);
        this.successMessage.set(
          `Order #${order._id.slice(-6).toUpperCase()} is ready — handed off to delivery.`
        );
      } else {
        this.orders.update((list) =>
          list.map((o) => (o._id === order._id ? { ...o, status: next } : o))
        );
        this.successMessage.set(
          `Order #${order._id.slice(-6).toUpperCase()} → ${next.replaceAll('_', ' ')}`
        );
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update order status.'));
    } finally {
      this.updatingOrderId.set(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _removeFromKitchen(orderId: string): void {
    this.orders.update((list) => list.filter((o) => o._id !== orderId));
    this.orderChecks.update((checks) => {
      const updated = { ...checks };
      delete updated[orderId];
      return updated;
    });
  }

  private _registerSocketListeners(): void {
    // A new order was placed — add it to the queue and fetch its ingredient check.
    this.socketService.on<IOrder>(SocketEvents.ORDER_CREATED, async (newOrder) => {
      const alreadyInList = this.orders().some((o) => o._id === newOrder._id);
      if (!alreadyInList) {
        this.orders.update((list) => [...list, newOrder]);
        try {
          const check = await this.orderService.checkOrderIngredients(newOrder._id);
          this.orderChecks.update((checks) => ({ ...checks, [newOrder._id]: check }));
        } catch {
          // Non-critical: the check will be missing but the order is still shown.
        }
      }

      this.snackBar.open(
        `New order #${newOrder._id.slice(-6).toUpperCase()} received!`,
        'Dismiss',
        { duration: 6000, panelClass: 'snack-info', horizontalPosition: 'end', verticalPosition: 'top' },
      );
    });

    // Status updates from other sessions (admin, concurrent kitchen tab) — update in place.
    const updateInPlace = (updated: IOrder) => {
      this.orders.update((list) =>
        list.map((o) => (o._id === updated._id ? updated : o))
      );
    };
    this.socketService.on<IOrder>(SocketEvents.ORDER_APPROVED, updateInPlace);
    this.socketService.on<IOrder>(SocketEvents.ORDER_IN_PREPARATION, updateInPlace);

    // Order marked READY — remove from kitchen (handed off to delivery).
    this.socketService.on<IOrder>(SocketEvents.ORDER_READY, (readyOrder) => {
      this._removeFromKitchen(readyOrder._id);
    });

    // Customer cancelled their order — remove it from the kitchen queue.
    this.socketService.on<IOrder>(SocketEvents.ORDER_CANCELLED, (cancelledOrder) => {
      this._removeFromKitchen(cancelledOrder._id);

      this.snackBar.open(
        `Order #${cancelledOrder._id.slice(-6).toUpperCase()} was cancelled by the customer.`,
        'Dismiss',
        { duration: 5000, panelClass: 'snack-warn', horizontalPosition: 'end', verticalPosition: 'top' },
      );
    });

    // An ingredient availability changed — reload the ingredients and order checks.
    this.socketService.on<{ ingredientId: string; status: string }>(
      SocketEvents.INGREDIENT_AVAILABILITY_CHANGED,
      () => {
        void this.loadAll().catch(() => undefined);
      },
    );

    // Kitchen issue reported (admin notification).
    this.socketService.on<{ ingredientId: string; message: string; reportedBy: string }>(
      SocketEvents.KITCHEN_ISSUE_REPORTED,
      (payload) => {
        this.snackBar.open(
          `Kitchen issue reported: ${payload.message ?? 'Ingredient shortage alert'}`,
          'Dismiss',
          { duration: 8000, panelClass: 'snack-warn', horizontalPosition: 'end', verticalPosition: 'top' },
        );
      },
    );
  }
}
