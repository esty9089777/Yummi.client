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
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DeliveryZoneService } from '../../../services/delivery-zone.service';
import { IDeliveryZone } from '../../../core/models/delivery-zone.model';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-delivery-zone-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './delivery-zone-management.component.html',
  styleUrl: './delivery-zone-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryZoneManagementComponent implements OnInit {
  private readonly zoneService = inject(DeliveryZoneService);
  private readonly fb = inject(FormBuilder);

  readonly zones = signal<IDeliveryZone[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingZone = signal<IDeliveryZone | null>(null);

  readonly displayedColumns = ['city', 'deliveryPrice', 'estimatedTime', 'status', 'actions'];

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

  ngOnInit(): void {
    void this.loadZones();
  }

  async loadZones(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const items = await this.zoneService.getAll();
      this.zones.set(items);
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
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  startEdit(zone: IDeliveryZone): void {
    this.showCreateForm.set(false);
    this.editingZone.set(zone);
    this.successMessage.set(null);
    this.errorMessage.set(null);
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

  async createZone(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { city, deliveryPrice, estimatedDeliveryMinutes } = this.createForm.getRawValue();

    try {
      await this.zoneService.create({
        city: city.trim(),
        deliveryPrice,
        estimatedDeliveryMinutes,
      });

      this.createForm.reset({ city: '', deliveryPrice: 0, estimatedDeliveryMinutes: 30 });
      this.showCreateForm.set(false);
      this.successMessage.set('Delivery zone created successfully.');
      await this.loadZones();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create delivery zone.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async saveEdit(): Promise<void> {
    const zone = this.editingZone();
    if (!zone || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { city, deliveryPrice, estimatedDeliveryMinutes } = this.editForm.getRawValue();

    try {
      await this.zoneService.update(zone.id, {
        city: city.trim(),
        deliveryPrice,
        estimatedDeliveryMinutes,
      });

      this.editingZone.set(null);
      this.editForm.reset();
      this.successMessage.set('Delivery zone updated successfully.');
      await this.loadZones();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update delivery zone.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleStatus(zone: IDeliveryZone): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.zoneService.setStatus(zone.id, { isActive: !zone.isActive });
      const label = zone.isActive ? 'deactivated' : 'activated';
      this.successMessage.set(`Delivery zone ${label} successfully.`);
      await this.loadZones();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update zone status.'));
    }
  }

  async deleteZone(zone: IDeliveryZone): Promise<void> {
    const confirmed = confirm(`Delete delivery zone for "${zone.city}"? This cannot be undone.`);
    if (!confirmed) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.zoneService.delete(zone.id);
      this.successMessage.set('Delivery zone deleted successfully.');
      if (this.editingZone()?.id === zone.id) {
        this.cancelEdit();
      }
      await this.loadZones();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete delivery zone.'));
    }
  }
}
