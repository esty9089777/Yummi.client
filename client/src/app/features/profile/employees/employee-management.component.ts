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
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { UserService } from '../../../services/user.service';
import { IUser } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/enums';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

const EMPLOYEE_ROLES = [UserRole.KITCHEN, UserRole.DELIVERY, UserRole.ADMIN];

@Component({
  selector: 'app-employee-management',
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
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  readonly employees = signal<IUser[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);

  readonly employeeRoles = EMPLOYEE_ROLES;
  readonly displayedColumns = ['fullName', 'email', 'roles', 'status', 'actions'];

  readonly createForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    roles: this.fb.nonNullable.control<UserRole[]>([], [Validators.required, Validators.minLength(1)]),
  });

  ngOnInit(): void {
    void this.loadEmployees();
  }

  async loadEmployees(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const users = await this.userService.getEmployees();
      this.employees.set(users);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load employees.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((value) => !value);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  isRoleSelected(role: UserRole): boolean {
    return this.createForm.controls.roles.value.includes(role);
  }

  toggleRole(role: UserRole, checked: boolean): void {
    const current = this.createForm.controls.roles.value;
    const next = checked ? [...current, role] : current.filter((item) => item !== role);
    this.createForm.controls.roles.setValue(next);
    this.createForm.controls.roles.markAsTouched();
  }

  async createEmployee(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { fullName, email, password, phone, roles } = this.createForm.getRawValue();

    try {
      await this.userService.createEmployee({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        roles,
      });

      this.createForm.reset({ roles: [] });
      this.showCreateForm.set(false);
      this.successMessage.set('Employee created successfully.');
      await this.loadEmployees();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create employee.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleEmployeeStatus(employee: IUser): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.userService.updateStatus(employee.id, { isActive: !employee.isActive });
      this.successMessage.set(
        employee.isActive ? 'Employee deactivated.' : 'Employee activated.',
      );
      await this.loadEmployees();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update employee status.'));
    }
  }
}
