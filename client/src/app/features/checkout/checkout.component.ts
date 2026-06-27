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
import { AuthService } from '../../services/auth.service';
import { IDeliveryZone } from '../../core/models/delivery-zone.model';
import { IDefaultAddress } from '../../core/models/user.model';
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
  private readonly authService = inject(AuthService);
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
  readonly useSavedAddress = signal(false);
  readonly selectedCity = signal<string>('');
  readonly deliveryStreet = signal<string>('');
  readonly deliveryHouseNumber = signal<string>('');

  readonly savedAddress = computed<IDefaultAddress | null>(
    () => this.authService.currentUser()?.defaultAddress ?? null,
  );

  readonly hasSavedAddress = computed(() => this.savedAddress() !== null);

  readonly isDelivery = computed(() => this.orderType() === OrderType.DELIVERY);

  readonly usingSavedAddress = computed(
    () => this.isDelivery() && this.hasSavedAddress() && this.useSavedAddress(),
  );

  readonly effectiveCity = computed(() => {
    if (this.usingSavedAddress()) {
      return this.savedAddress()!.city;
    }
    return this.selectedCity();
  });

  readonly selectedZone = computed<IDeliveryZone | null>(() => {
    const city = this.effectiveCity().trim();
    if (!city) {
      return null;
    }
    return this.zones().find((zone) => zone.city === city) ?? null;
  });

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
    if (!this.isDelivery()) {
      return true;
    }

    if (this.usingSavedAddress()) {
      return this.selectedZone() !== null;
    }

    return (
      this.selectedCity().trim().length > 0 &&
      this.deliveryStreet().trim().length >= 2 &&
      this.deliveryHouseNumber().trim().length >= 1 &&
      this.selectedZone() !== null
    );
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

      if (this.savedAddress()) {
        this.useSavedAddress.set(true);
        this.selectedCity.set(this.savedAddress()!.city);
      }
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

  setUseSavedAddress(useSaved: boolean): void {
    this.useSavedAddress.set(useSaved);
    this.errorMessage.set(null);

    if (useSaved && this.savedAddress()) {
      this.selectedCity.set(this.savedAddress()!.city);
    }
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
          ? this.usingSavedAddress()
            ? { useDefaultAddress: true }
            : {
                deliveryCity: this.selectedCity().trim(),
                deliveryAddress: `${this.deliveryStreet().trim()} ${this.deliveryHouseNumber().trim()}`.trim(),
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
