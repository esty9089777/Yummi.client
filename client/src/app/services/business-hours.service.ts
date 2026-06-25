import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  IBusinessHours,
  IBusinessHoursResponse,
  IIsOpenResult,
  IUpdateWeeklyScheduleDto,
  IAddSpecialDayDto,
} from '../core/models/business-hours.model';

@Injectable({ providedIn: 'root' })
export class BusinessHoursService {
  private readonly api = inject(ApiService);

  async get(): Promise<IBusinessHours> {
    const res = await this.api.http.get<ApiResponse<IBusinessHoursResponse>>('/business-hours');
    const { businessHours } = this.api.unwrap(res);
    return businessHours;
  }

  async isOpenNow(): Promise<IIsOpenResult> {
    const res = await this.api.http.get<ApiResponse<IIsOpenResult>>('/business-hours/is-open');
    return this.api.unwrap(res);
  }

  async updateWeeklySchedule(dto: IUpdateWeeklyScheduleDto): Promise<IBusinessHours> {
    const res = await this.api.http.put<ApiResponse<IBusinessHoursResponse>>(
      '/business-hours/weekly-schedule',
      dto,
    );
    const { businessHours } = this.api.unwrap(res);
    return businessHours;
  }

  async addSpecialDay(dto: IAddSpecialDayDto): Promise<IBusinessHours> {
    const res = await this.api.http.post<ApiResponse<IBusinessHoursResponse>>(
      '/business-hours/special-days',
      dto,
    );
    const { businessHours } = this.api.unwrap(res);
    return businessHours;
  }

  async removeSpecialDay(date: string): Promise<IBusinessHours> {
    const res = await this.api.http.delete<ApiResponse<IBusinessHoursResponse>>(
      `/business-hours/special-days/${encodeURIComponent(date)}`,
    );
    const { businessHours } = this.api.unwrap(res);
    return businessHours;
  }
}
