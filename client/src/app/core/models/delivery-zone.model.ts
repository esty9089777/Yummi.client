export interface IDeliveryZone {
  id: string;
  city: string;
  deliveryPrice: number;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface ISetDeliveryZoneStatusDto {
  isActive: boolean;
}

export interface IDeliveryZoneResponse {
  zone: IDeliveryZone;
}

export interface IDeliveryZonesResponse {
  zones: IDeliveryZone[];
}
