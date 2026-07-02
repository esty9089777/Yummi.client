import { effect, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService, SocketEvents } from '../core/services/socket.service';
import { IOrder } from '../core/models/order.model';
import { UserRole } from '../core/models/enums';
import { AuthService } from './auth.service';

/**
 * Redirects customers to the reviews page when one of their orders is completed.
 */
@Injectable({ providedIn: 'root' })
export class CustomerOrderCompletionService {
  private readonly auth = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  private unsubscribe: (() => void) | null = null;

  constructor() {
    effect(() => {
      const isCustomer = this.auth.activeRole() === UserRole.CUSTOMER && this.auth.isLoggedIn();
      if (isCustomer) {
        this._registerListener();
      } else {
        this._unregisterListener();
      }
    });
  }

  private _registerListener(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = this.socketService.on<IOrder>(SocketEvents.ORDER_COMPLETED, (order) => {
      void this.router.navigate(['/reviews'], {
        queryParams: { orderId: order._id },
      });
    });
  }

  private _unregisterListener(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
