import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { BusinessHoursService } from '../../services/business-hours.service';
import { getApiErrorMessage } from '../../core/utils/api-error.util';
import type {
  IWeeklyScheduleEntry,
  ISpecialDay,
  IIsOpenResult,
  IAddSpecialDayDto,
} from '../../core/models/business-hours.model';

@Component({
  selector: 'app-business-hours',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './business-hours.component.html',
  styleUrl: './business-hours.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursComponent implements OnInit {
  private readonly bhService = inject(BusinessHoursService);
  private readonly fb = inject(FormBuilder);

  readonly DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  readonly isLoading = signal(true);
  readonly isSubmittingSchedule = signal(false);
  readonly isSubmittingSpecialDay = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly openStatus = signal<IIsOpenResult | null>(null);
  readonly specialDays = signal<ISpecialDay[]>([]);

  /** Weekly schedule stored as a mutable signal — changes trigger re-render with OnPush. */
  readonly weeklySchedule = signal<IWeeklyScheduleEntry[]>([
    { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00', isClosed: true },
  ]);

  readonly specialDayForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    endDate: [''],
    label: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    isClosed: [true],
    openTime: ['09:00'],
    closeTime: ['22:00'],
  });

  /** `true` when the special-day form is set to open (not closed). */
  readonly specialDayIsOpen = signal(false);

  readonly specialDayDisplayedColumns = ['date', 'label', 'hours', 'actions'];

  ngOnInit(): void {
    void this.loadData();

    this.specialDayForm.get('isClosed')?.valueChanges.subscribe((isClosed) => {
      this.specialDayIsOpen.set(!isClosed);
    });
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [bh, status] = await Promise.all([
        this.bhService.get(),
        this.bhService.isOpenNow(),
      ]);
      this.openStatus.set(status);
      this.specialDays.set(bh.specialDays);
      const sorted = [...bh.weeklySchedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      this.weeklySchedule.set(sorted);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load business hours.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  updateDay(index: number, field: keyof IWeeklyScheduleEntry, value: string | boolean): void {
    this.weeklySchedule.update((schedule) => {
      const updated = [...schedule];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async saveSchedule(): Promise<void> {
    this.isSubmittingSchedule.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const bh = await this.bhService.updateWeeklySchedule({
        weeklySchedule: this.weeklySchedule(),
      });
      this.specialDays.set(bh.specialDays);
      const sorted = [...bh.weeklySchedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      this.weeklySchedule.set(sorted);
      const status = await this.bhService.isOpenNow();
      this.openStatus.set(status);
      this.successMessage.set('Weekly schedule saved successfully.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to save schedule.'));
    } finally {
      this.isSubmittingSchedule.set(false);
    }
  }

  async addSpecialDay(): Promise<void> {
    if (this.specialDayForm.invalid) {
      this.specialDayForm.markAllAsTouched();
      return;
    }
    this.isSubmittingSpecialDay.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const val = this.specialDayForm.getRawValue();
      const dto: IAddSpecialDayDto = {
        date: val.date,
        label: val.label.trim(),
        isClosed: val.isClosed,
      };
      if (val.endDate) dto.endDate = val.endDate;
      if (!val.isClosed) {
        dto.openTime = val.openTime;
        dto.closeTime = val.closeTime;
      }

      const bh = await this.bhService.addSpecialDay(dto);
      this.specialDays.set(bh.specialDays);
      this.specialDayForm.reset({ date: '', endDate: '', label: '', isClosed: true, openTime: '09:00', closeTime: '22:00' });
      this.specialDayIsOpen.set(false);
      const status = await this.bhService.isOpenNow();
      this.openStatus.set(status);
      this.successMessage.set('Special day saved successfully.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to save special day.'));
    } finally {
      this.isSubmittingSpecialDay.set(false);
    }
  }

  async removeSpecialDay(date: string, label: string): Promise<void> {
    const confirmed = confirm(`Remove special day "${label}" (${date})?`);
    if (!confirmed) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const bh = await this.bhService.removeSpecialDay(date);
      this.specialDays.set(bh.specialDays);
      const status = await this.bhService.isOpenNow();
      this.openStatus.set(status);
      this.successMessage.set('Special day removed.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to remove special day.'));
    }
  }

  formatHours(day: ISpecialDay): string {
    if (day.isClosed) return 'Closed';
    return `${day.openTime} – ${day.closeTime}`;
  }

  formatDateRange(day: ISpecialDay): string {
    if (day.endDate && day.endDate !== day.date) {
      return `${day.date} → ${day.endDate}`;
    }
    return day.date;
  }
}
