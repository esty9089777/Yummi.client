import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement create(dto)  [CUSTOMER]
  // TODO: implement getAll()  [ADMIN]
  // TODO: implement getById(id)  [ADMIN, CUSTOMER]
}
