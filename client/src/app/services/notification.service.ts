import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SocketService, SocketEvents } from '../core/services/socket.service';
import { INotification } from '../core/models/notification.model';
import type { ApiResponse } from '../core/models/api-response.model';

interface INotificationsResponse {
  notifications: INotification[];
}

interface INotificationResponse {
  notification: INotification;
}

/**
 * Manages in-app notifications.
 * Loads the notification list via HTTP on init and appends new
 * notifications pushed over Socket.IO in real time.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);

  private readonly _notifications = signal<INotification[]>([]);
  private readonly _isLoading = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly unreadCount = computed(
    () => this._notifications().filter((n) => !n.isRead).length
  );

  constructor() {
    this.socketService.on<INotification | { message: string; type: string; orderId?: string }>(
      SocketEvents.NOTIFICATION_NEW,
      (payload) => this._handleIncomingNotification(payload)
    );
  }

  ngOnDestroy(): void {
    this.socketService.off(SocketEvents.NOTIFICATION_NEW);
  }

  /** Fetches all notifications for the authenticated user from the server. */
  async load(): Promise<void> {
    this._isLoading.set(true);
    try {
      const res = await this.api.http.get<ApiResponse<INotificationsResponse>>(
        '/notifications'
      );
      const { notifications } = this.api.unwrap(res);
      this._notifications.set(notifications ?? []);
    } catch {
      // Silently fail — unreadCount stays 0, no crash
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Marks a single notification as read (optimistic + server persist). */
  async markAsRead(id: string): Promise<void> {
    this._notifications.update((list) =>
      list.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await this.api.http.patch<ApiResponse<INotificationResponse>>(
        `/notifications/${id}/read`,
        {}
      );
    } catch {
      // Revert on failure
      this._notifications.update((list) =>
        list.map((n) => (n._id === id ? { ...n, isRead: false } : n))
      );
    }
  }

  /** Marks every unread notification as read. */
  async markAllAsRead(): Promise<void> {
    this._notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await this.api.http.patch<ApiResponse<unknown>>('/notifications/read-all', {});
    } catch {
      await this.load();
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _handleIncomingNotification(
    payload: INotification | { message: string; type: string; orderId?: string }
  ): void {
    if (this._isFullNotification(payload)) {
      this._notifications.update((list) => [payload, ...list]);
    } else {
      const synthetic: INotification = {
        _id: `local-${Date.now()}`,
        recipient: '',
        type: payload.type,
        message: payload.message,
        data: payload.orderId ? { orderId: payload.orderId } : undefined,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this._notifications.update((list) => [synthetic, ...list]);
    }
  }

  private _isFullNotification(
    payload: INotification | { message: string; type: string; orderId?: string }
  ): payload is INotification {
    return '_id' in payload && 'recipient' in payload;
  }
}
