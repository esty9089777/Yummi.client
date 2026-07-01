import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import { IDashboardStats, IDashboardStatsResponse } from '../core/models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly api = inject(ApiService);

  /** Admin dashboard KPIs from GET /stats. */
  async getDashboard(): Promise<IDashboardStats> {
    const res = await this.api.http.get<ApiResponse<IDashboardStatsResponse>>('/stats');
    const { stats } = this.api.unwrap(res);
    return stats;
  }
}
