import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement getMyOrders()  [CUSTOMER]
  // TODO: implement getAllOrders()  [KITCHEN, DELIVERY, ADMIN]
  // TODO: implement getKitchenOrders()  [KITCHEN, ADMIN]
  // TODO: implement createOrder(dto)  [CUSTOMER]
  // TODO: implement updateStatus(id, dto)  [KITCHEN, DELIVERY, ADMIN]
  // TODO: implement cancelOrder(id, dto)  [CUSTOMER]
}
