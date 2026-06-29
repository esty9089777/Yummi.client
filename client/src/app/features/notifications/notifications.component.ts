import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification.service';
import { IngredientService } from '../../services/ingredient.service';
import { AuthService } from '../../services/auth.service';
import { INotification } from '../../core/models/notification.model';
import { UserRole } from '../../core/models/enums';
import {
  getNotificationIngredientId,
  isKitchenIssueNotification,
} from '../../core/utils/notification.util';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly ingredientService = inject(IngredientService);
  private readonly auth = inject(AuthService);

  readonly notifications = this.notificationService.notifications;
  readonly isLoading = this.notificationService.isLoading;
  readonly replenishingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.activeRole() === UserRole.ADMIN);

  async ngOnInit(): Promise<void> {
    await this.auth.ensureSessionInitialized();
    await this.notificationService.load();
  }

  async markRead(notification: INotification): Promise<void> {
    if (!notification.isRead) {
      await this.notificationService.markAsRead(notification._id);
    }
  }

  async markAllRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  isKitchenIssue(notification: INotification): boolean {
    return isKitchenIssueNotification(notification);
  }

  canReplenish(notification: INotification): boolean {
    return (
      this.isAdmin() &&
      this.isKitchenIssue(notification) &&
      !!getNotificationIngredientId(notification)
    );
  }

  async replenishInventory(notification: INotification, event: Event): Promise<void> {
    event.stopPropagation();

    const ingredientId = getNotificationIngredientId(notification);
    if (!ingredientId) {
      return;
    }

    this.replenishingId.set(notification._id);
    this.actionError.set(null);

    try {
      await this.ingredientService.replenish(ingredientId, {
        notificationId: notification._id.startsWith('local-') ? undefined : notification._id,
      });
      this.notificationService.removeKitchenIssueNotifications(ingredientId, notification._id);
    } catch (error) {
      this.actionError.set(getApiErrorMessage(error, 'Failed to replenish inventory.'));
    } finally {
      this.replenishingId.set(null);
    }
  }

  iconFor(type: string): string {
    if (type.includes('READY')) return 'check_circle';
    if (type.includes('CANCELLED')) return 'cancel';
    if (type.includes('APPROVED')) return 'thumb_up';
    if (type.includes('PREPARATION')) return 'soup_kitchen';
    if (type.includes('COMPLETED')) return 'done_all';
    if (type.includes('CREATED')) return 'add_circle';
    if (type.includes('ISSUE') || type.includes('SHORTAGE')) return 'warning';
    return 'notifications';
  }

  trackById(_: number, n: INotification): string {
    return n._id;
  }
}
