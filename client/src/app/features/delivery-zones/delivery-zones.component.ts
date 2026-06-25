import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { DeliveryZoneService } from '../../services/delivery-zone.service';
import { UserRole } from '../../core/models/enums';
import type { IDeliveryZone } from '../../core/models/delivery-zone.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-delivery-zones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './delivery-zones.component.html',
  styleUrl: './delivery-zones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryZonesComponent implements OnInit {
  private readonly zoneService = inject(DeliveryZoneService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly zones = this.zoneService.zones;
  readonly isAdmin = computed(() => this.auth.activeRole() === UserRole.ADMIN);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly togglingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingZone = signal<IDeliveryZone | null>(null);

  readonly displayedColumns = computed(() =>
    this.isAdmin()
      ? ['city', 'deliveryPrice', 'eta', 'status', 'actions']
      : ['city', 'deliveryPrice', 'eta', 'status'],
  );

  readonly createForm = this.fb.nonNullable.group({
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    deliveryPrice: [0, [Validators.required, Validators.min(0)]],
    estimatedDeliveryMinutes: [30, [Validators.required, Validators.min(1)]],
  });

  readonly editForm = this.fb.nonNullable.group({
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    deliveryPrice: [0, [Validators.required, Validators.min(0)]],
    estimatedDeliveryMinutes: [30, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.zoneService.getAll();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load delivery zones.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    this.editingZone.set(null);
    this.createForm.reset({ city: '', deliveryPrice: 0, estimatedDeliveryMinutes: 30 });
    this.clearMessages();
  }

  startEdit(zone: IDeliveryZone): void {
    this.showCreateForm.set(false);
    this.editingZone.set(zone);
    this.clearMessages();
    this.editForm.patchValue({
      city: zone.city,
      deliveryPrice: zone.deliveryPrice,
      estimatedDeliveryMinutes: zone.estimatedDeliveryMinutes,
    });
  }

  cancelEdit(): void {
    this.editingZone.set(null);
    this.editForm.reset();
  }

  async onCreate(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.clearMessages();

    const { city, deliveryPrice, estimatedDeliveryMinutes } = this.createForm.getRawValue();

    try {
      await this.zoneService.create({
        city: city.trim(),
        deliveryPrice: Number(deliveryPrice),
        estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes),
      });
      this.createForm.reset({ city: '', deliveryPrice: 0, estimatedDeliveryMinutes: 30 });
      this.showCreateForm.set(false);
      this.successMessage.set('Delivery zone created.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create delivery zone.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onSaveEdit(): Promise<void> {
    const zone = this.editingZone();
    if (!zone || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.clearMessages();

    const { city, deliveryPrice, estimatedDeliveryMinutes } = this.editForm.getRawValue();

    try {
      await this.zoneService.update(zone._id, {
        city: city.trim(),
        deliveryPrice: Number(deliveryPrice),
        estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes),
      });
      this.editingZone.set(null);
      this.successMessage.set('Delivery zone updated.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update delivery zone.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onToggleStatus(zone: IDeliveryZone): Promise<void> {
    this.togglingId.set(zone._id);
    this.clearMessages();
    try {
      await this.zoneService.setStatus(zone._id, !zone.isActive);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update status.'));
    } finally {
      this.togglingId.set(null);
    }
  }

  async onDelete(zone: IDeliveryZone): Promise<void> {
    if (!confirm(`Delete delivery zone for "${zone.city}"? This cannot be undone.`)) {
      return;
    }
    this.deletingId.set(zone._id);
    this.clearMessages();
    try {
      await this.zoneService.delete(zone._id);
      this.successMessage.set(`Zone "${zone.city}" deleted.`);
      if (this.editingZone()?._id === zone._id) {
        this.cancelEdit();
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete delivery zone.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
