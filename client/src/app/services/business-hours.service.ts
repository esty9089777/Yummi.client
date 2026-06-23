import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BusinessHoursService {
  constructor(private readonly api: ApiService) {}

  // TODO: implement get()
  // TODO: implement isOpenNow()
  // TODO: implement updateWeeklySchedule(dto)  [ADMIN]
  // TODO: implement addSpecialDay(dto)  [ADMIN]
  // TODO: implement removeSpecialDay(date)  [ADMIN]
}
