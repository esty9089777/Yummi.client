import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement getMine()
  // TODO: implement markAsRead(id)
}
