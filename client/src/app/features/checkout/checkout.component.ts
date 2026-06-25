import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { DeliveryZoneService } from '../../services/delivery-zone.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { IDeliveryZone } from '../../core/models/delivery-zone.model';
import { OrderType } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly deliveryZoneService = inject(DeliveryZoneService);
  private readonly businessHoursService = inject(BusinessHoursService);
  private readonly router = inject(Router);

  readonly OrderType = OrderType;

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly isEmpty = this.cartService.isEmpty;

  readonly isLoading = signal(true);
  readonly isPlacing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly zones = signal<IDeliveryZone[]>([]);
  readonly isOpen = signal(true);
  readonly closedReason = signal<string | null>(null);

  readonly orderType = signal<OrderType>(OrderType.PICKUP);
  readonly selectedCity = signal<string>('');
  readonly deliveryAddress = signal<string>('');

  readonly isDelivery = computed(() => this.orderType() === OrderType.DELIVERY);

  readonly selectedZone = computed<IDeliveryZone | null>(
    () => this.zones().find((zone) => zone.city === this.selectedCity()) ?? null,
  );

  readonly deliveryFee = computed(() =>
    this.isDelivery() ? (this.selectedZone()?.deliveryPrice ?? 0) : 0,
  );

  readonly total = computed(() =>
    parseFloat((this.subtotal() + this.deliveryFee()).toFixed(2)),
  );

  readonly canPlaceOrder = computed(() => {
    if (this.isEmpty() || !this.isOpen() || this.isPlacing()) {
      return false;
    }
    if (this.isDelivery()) {
      return this.selectedCity().trim().length > 0 && this.deliveryAddress().trim().length >= 2;
    }
    return true;
  });

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [, zones, openStatus] = await Promise.all([
        this.cartService.load(),
        this.deliveryZoneService.getAll(),
        this.businessHoursService.isOpenNow(),
      ]);

      this.zones.set(zones.filter((zone) => zone.isActive));
      this.isOpen.set(openStatus.isOpen);
      this.closedReason.set(openStatus.isOpen ? null : openStatus.reason);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load checkout details.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  setOrderType(type: OrderType): void {
    this.orderType.set(type);
    this.errorMessage.set(null);
  }

  async placeOrder(): Promise<void> {
    if (!this.canPlaceOrder()) {
      return;
    }

    this.isPlacing.set(true);
    this.errorMessage.set(null);

    try {
      const order = await this.orderService.createOrder({
        orderType: this.orderType(),
        ...(this.isDelivery()
          ? {
              deliveryCity: this.selectedCity().trim(),
              deliveryAddress: this.deliveryAddress().trim(),
            }
          : {}),
      });

      this.cartService.reset();
      await this.router.navigate(['/orders'], {
        queryParams: { placed: order._id },
      });
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Could not place your order.'));
    } finally {
      this.isPlacing.set(false);
    }
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }
}
