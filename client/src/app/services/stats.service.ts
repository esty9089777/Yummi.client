import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement getDashboard()  [ADMIN]
}
