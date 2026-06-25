import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
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
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly activeRole = this.auth.activeRole;
  readonly currentUser = this.auth.currentUser;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly UserRole = UserRole;

  isRole(...roles: UserRole[]): boolean {
    const role = this.activeRole();
    return role !== null && roles.includes(role);
  }

  logout(): void {
    this.socketService.disconnect();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
