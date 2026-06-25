import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  IDeliveryZone,
  IDeliveryZoneResponse,
  IDeliveryZonesResponse,
  ICreateDeliveryZoneDto,
  IUpdateDeliveryZoneDto,
  ISetDeliveryZoneStatusDto,
} from '../core/models/delivery-zone.model';

@Injectable({ providedIn: 'root' })
export class DeliveryZoneService {
  private readonly api = inject(ApiService);

  async getAll(): Promise<IDeliveryZone[]> {
    const res = await this.api.http.get<ApiResponse<IDeliveryZonesResponse>>('/delivery-zones');
    const { zones } = this.api.unwrap(res);
    return zones;
  }

  async getById(id: string): Promise<IDeliveryZone> {
    const res = await this.api.http.get<ApiResponse<IDeliveryZoneResponse>>(
      `/delivery-zones/${id}`,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }

  async checkCity(city: string): Promise<IDeliveryZone> {
    const res = await this.api.http.get<ApiResponse<IDeliveryZoneResponse>>(
      `/delivery-zones/city/${encodeURIComponent(city)}`,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }

  async create(dto: ICreateDeliveryZoneDto): Promise<IDeliveryZone> {
    const res = await this.api.http.post<ApiResponse<IDeliveryZoneResponse>>(
      '/delivery-zones',
      dto,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }

  async update(id: string, dto: IUpdateDeliveryZoneDto): Promise<IDeliveryZone> {
    const res = await this.api.http.patch<ApiResponse<IDeliveryZoneResponse>>(
      `/delivery-zones/${id}`,
      dto,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }

  async setStatus(id: string, dto: ISetDeliveryZoneStatusDto): Promise<IDeliveryZone> {
    const res = await this.api.http.patch<ApiResponse<IDeliveryZoneResponse>>(
      `/delivery-zones/${id}/status`,
      dto,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }

  async delete(id: string): Promise<IDeliveryZone> {
    const res = await this.api.http.delete<ApiResponse<IDeliveryZoneResponse>>(
      `/delivery-zones/${id}`,
    );
    const { zone } = this.api.unwrap(res);
    return zone;
  }
}
