import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../core/models/notification.model';

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
  readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;
  readonly isLoading = this.notificationService.isLoading;

  async ngOnInit(): Promise<void> {
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
