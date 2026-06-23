import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement getAll()
  // TODO: implement getById(id)
  // TODO: implement create(dto)  [ADMIN]
  // TODO: implement update(id, dto)  [ADMIN]
  // TODO: implement setStatus(id, status)  [KITCHEN, ADMIN]
  // TODO: implement delete(id)  [ADMIN]
}
