import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import { CartService } from '../../services/cart.service';
import { ICartItem } from '../../core/models/cart.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly isEmpty = this.cartService.isEmpty;

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  /** Tracks which line is mid-update so its buttons can be disabled. */
  readonly busyItemId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  lineTotal(item: ICartItem): number {
    return this.cartService.lineTotal(item);
  }

  extrasLabel(item: ICartItem): string {
    return item.selectedExtras.map((extra) => extra.name).join(', ');
  }

  async changeQuantity(item: ICartItem, delta: number): Promise<void> {
    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 1) {
      await this.remove(item);
      return;
    }

    await this.runLineAction(item, () =>
      this.cartService.updateItem(item.productId._id, {
        quantity: nextQuantity,
        selectedExtras: this.extraIds(item),
      }),
    );
  }

  async remove(item: ICartItem): Promise<void> {
    await this.runLineAction(item, () =>
      this.cartService.removeItem(item.productId._id, this.extraIds(item)),
    );
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }

  private extraIds(item: ICartItem): string[] {
    return item.selectedExtras.map((extra) => extra._id);
  }

  private async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.cartService.load();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load your cart.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async runLineAction(item: ICartItem, action: () => Promise<unknown>): Promise<void> {
    this.errorMessage.set(null);
    this.busyItemId.set(item._id);
    try {
      await action();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Could not update the cart.'));
    } finally {
      this.busyItemId.set(null);
    }
  }
}
