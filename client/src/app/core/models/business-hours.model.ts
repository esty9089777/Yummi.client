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
  _id: string;
  weeklySchedule: IWeeklyScheduleEntry[];
  specialDays: ISpecialDay[];
  createdAt: string;
  updatedAt: string;
}
