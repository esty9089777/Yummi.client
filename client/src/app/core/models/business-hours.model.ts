export interface IWeeklyScheduleEntry {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ISpecialDay {
  date: string;
  endDate?: string;
  label: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface IBusinessHours {
  id: string;
  weeklySchedule: IWeeklyScheduleEntry[];
  specialDays: ISpecialDay[];
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateWeeklyScheduleDto {
  weeklySchedule: IWeeklyScheduleEntry[];
}

export interface IAddSpecialDayDto {
  date: string;
  endDate?: string;
  label: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface IBusinessHoursResponse {
  businessHours: IBusinessHours;
}

export interface IIsOpenResult {
  isOpen: boolean;
  reason: string;
  currentTime: string;
  todaySchedule: IWeeklyScheduleEntry | ISpecialDay | null;
}
