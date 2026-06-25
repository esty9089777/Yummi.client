import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import type { IDeliveryZone } from '../core/models/delivery-zone.model';

export interface ICreateDeliveryZoneDto {
  city: string;
  deliveryPrice: number;
  estimatedDeliveryMinutes: number;
}

export interface IUpdateDeliveryZoneDto {
  city?: string;
  deliveryPrice?: number;
  estimatedDeliveryMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryZoneService {
  private readonly _zones = signal<IDeliveryZone[]>([]);
  readonly zones = this._zones.asReadonly();

  constructor(private readonly api: ApiService) {}

  async getAll(): Promise<IDeliveryZone[]> {
    const res = await this.api.http.get<ApiResponse<IDeliveryZone[]>>('/delivery-zones');
    const zones = this.api.unwrap(res);
    this._zones.set(zones);
    return zones;
  }

  async getByCity(city: string): Promise<IDeliveryZone> {
    const res = await this.api.http.get<ApiResponse<IDeliveryZone>>(
      `/delivery-zones/city/${encodeURIComponent(city)}`,
    );
    return this.api.unwrap(res);
  }

  async create(dto: ICreateDeliveryZoneDto): Promise<IDeliveryZone> {
    const res = await this.api.http.post<ApiResponse<IDeliveryZone>>('/delivery-zones', dto);
    const zone = this.api.unwrap(res);
    this._zones.update((prev) => [...prev, zone]);
    return zone;
  }

  async update(id: string, dto: IUpdateDeliveryZoneDto): Promise<IDeliveryZone> {
    const res = await this.api.http.patch<ApiResponse<IDeliveryZone>>(
      `/delivery-zones/${id}`,
      dto,
    );
    const updated = this.api.unwrap(res);
    this._zones.update((prev) => prev.map((z) => (z._id === id ? updated : z)));
    return updated;
  }

  async setStatus(id: string, isActive: boolean): Promise<IDeliveryZone> {
    const res = await this.api.http.patch<ApiResponse<IDeliveryZone>>(
      `/delivery-zones/${id}/status`,
      { isActive },
    );
    const updated = this.api.unwrap(res);
    this._zones.update((prev) => prev.map((z) => (z._id === id ? updated : z)));
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.api.http.delete(`/delivery-zones/${id}`);
    this._zones.update((prev) => prev.filter((z) => z._id !== id));
  }
}
