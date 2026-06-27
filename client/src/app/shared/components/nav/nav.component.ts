import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { CartService } from '../../../services/cart.service';
import { UserRole } from '../../../core/models/enums';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  private readonly auth = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly activeRole = this.auth.activeRole;
  readonly currentUser = this.auth.currentUser;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly cartCount = this.cartService.itemCount;

  readonly UserRole = UserRole;

  constructor() {
    // Keep the cart badge in sync: load the cart whenever a customer session is active.
    effect(() => {
      if (this.activeRole() === UserRole.CUSTOMER) {
        void this.cartService.load().catch(() => undefined);
      } else {
        this.cartService.reset();
      }
    });

    // Load notifications once a session is established (any role).
    effect(() => {
      if (this.isLoggedIn()) {
        void this.notificationService.load().catch(() => undefined);
      }
    });
  }

  isRole(...roles: UserRole[]): boolean {
    const role = this.activeRole();
    return role !== null && roles.includes(role);
  }

  logout(): void {
    this.cartService.reset();
    this.auth.logout(); // also disconnects socket
    void this.router.navigate(['/login']);
  }
}
