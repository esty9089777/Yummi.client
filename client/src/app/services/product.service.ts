import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement getById(id)
  // TODO: implement create(dto)  [ADMIN]
  // TODO: implement update(id, dto)  [ADMIN]
  // TODO: implement setAvailability(id, isAvailable)  [ADMIN, KITCHEN]
  // TODO: implement delete(id)  [ADMIN]
}
