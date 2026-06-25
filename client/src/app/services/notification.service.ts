import { Injectable, computed, signal } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<never[]>([]);

  readonly unreadCount = computed(() => this._notifications().length);

  constructor(private readonly api: ApiService) {}

  // TODO: implement getMine()
  // TODO: implement markAsRead(id)
}
