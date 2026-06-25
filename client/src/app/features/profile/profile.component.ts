import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly activeRole = this.auth.activeRole;
  readonly availableRoles = computed(() => this.user()?.roles ?? []);
  readonly canManageEmployees = computed(() => this.activeRole() === UserRole.ADMIN);

  readonly isSavingProfile = signal(false);
  readonly isSwitchingRole = signal(false);
  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly roleError = signal<string | null>(null);
  readonly includeAddress = signal(false);

  readonly selectedRole = signal<UserRole | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    city: [''],
    street: [''],
    houseNumber: [''],
  });

  ngOnInit(): void {
    const current = this.user();
    if (!current) {
      return;
    }

    this.selectedRole.set(this.activeRole());
    this.includeAddress.set(!!current.defaultAddress);

    this.profileForm.patchValue({
      fullName: current.fullName,
      phone: current.phone,
      city: current.defaultAddress?.city ?? '',
      street: current.defaultAddress?.street ?? '',
      houseNumber: current.defaultAddress?.houseNumber ?? '',
    });
  }

  toggleAddress(include: boolean): void {
    this.includeAddress.set(include);
    if (!include) {
      this.profileForm.patchValue({ city: '', street: '', houseNumber: '' });
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.profileMessage.set(null);
    this.profileError.set(null);

    const { fullName, phone, city, street, houseNumber } = this.profileForm.getRawValue();

    try {
      await this.auth.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        defaultAddress: this.includeAddress()
          ? {
              city: city.trim(),
              street: street.trim(),
              houseNumber: houseNumber.trim(),
            }
          : null,
      });
      this.includeAddress.set(!!this.auth.currentUser()?.defaultAddress);
      this.profileMessage.set('Profile updated successfully.');
    } catch (error) {
      this.profileError.set(getApiErrorMessage(error, 'Failed to update profile.'));
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  async switchRole(): Promise<void> {
    const role = this.selectedRole();
    if (!role || role === this.activeRole()) {
      return;
    }

    this.isSwitchingRole.set(true);
    this.roleError.set(null);

    try {
      await this.auth.switchActiveRole({ activeRole: role });
    } catch (error) {
      this.roleError.set(getApiErrorMessage(error, 'Failed to switch role.'));
    } finally {
      this.isSwitchingRole.set(false);
    }
  }
}
