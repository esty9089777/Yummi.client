import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeliveryZoneService } from '../../services/delivery-zone.service';
import type { IDeliveryZone } from '../../core/models/delivery-zone.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-delivery-zones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
  private readonly fb = inject(FormBuilder);

  readonly zones = signal<IDeliveryZone[]>([]);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly togglingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingZone = signal<IDeliveryZone | null>(null);

  readonly displayedColumns = ['city', 'deliveryPrice', 'eta', 'status', 'actions'];

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
      await this.loadZones();
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
      await this.zoneService.update(zone.id, {
        city: city.trim(),
        deliveryPrice: Number(deliveryPrice),
        estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes),
      });
      this.editingZone.set(null);
      this.successMessage.set('Delivery zone updated.');
      await this.loadZones();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update delivery zone.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onToggleStatus(zone: IDeliveryZone): Promise<void> {
    this.togglingId.set(zone.id);
    this.clearMessages();
    try {
      await this.zoneService.setStatus(zone.id, { isActive: !zone.isActive });
      await this.loadZones();
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
    this.deletingId.set(zone.id);
    this.clearMessages();
    try {
      await this.zoneService.delete(zone.id);
      this.successMessage.set(`Zone "${zone.city}" deleted.`);
      if (this.editingZone()?.id === zone.id) {
        this.cancelEdit();
      }
      await this.loadZones();
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
