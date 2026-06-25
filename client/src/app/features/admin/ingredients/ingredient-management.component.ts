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
import { IngredientService } from '../../../services/ingredient.service';
import {
  IIngredient,
  IIngredientWithUsage,
} from '../../../core/models/ingredient.model';
import { IngredientStatus } from '../../../core/models/enums';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-ingredient-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ingredient-management.component.html',
  styleUrl: './ingredient-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientManagementComponent implements OnInit {
  private readonly ingredientService = inject(IngredientService);
  private readonly fb = inject(FormBuilder);

  readonly IngredientStatus = IngredientStatus;

  readonly ingredients = signal<IIngredient[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingIngredient = signal<IIngredient | null>(null);

  readonly displayedColumns = ['name', 'status', 'usage', 'actions'];

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });

  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    void this.loadIngredients();
  }

  async loadIngredients(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const items = await this.ingredientService.getAll();
      this.ingredients.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load ingredients.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  getUsage(ingredient: IIngredient): string {
    const withUsage = ingredient as IIngredientWithUsage;
    if (!withUsage.usage) {
      return '—';
    }

    return `${withUsage.usage.baseProductCount} base / ${withUsage.usage.extraProductCount} extra`;
  }

  statusLabel(status: IngredientStatus): string {
    return status === IngredientStatus.AVAILABLE ? 'Available' : 'Unavailable';
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((value) => !value);
    this.editingIngredient.set(null);
    this.createForm.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  startEdit(ingredient: IIngredient): void {
    this.showCreateForm.set(false);
    this.editingIngredient.set(ingredient);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.editForm.patchValue({ name: ingredient.name });
  }

  cancelEdit(): void {
    this.editingIngredient.set(null);
    this.editForm.reset();
  }

  async createIngredient(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { name } = this.createForm.getRawValue();

    try {
      await this.ingredientService.create({ name: name.trim() });
      this.createForm.reset();
      this.showCreateForm.set(false);
      this.successMessage.set('Ingredient created successfully.');
      await this.loadIngredients();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create ingredient.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async saveEdit(): Promise<void> {
    const ingredient = this.editingIngredient();
    if (!ingredient || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { name } = this.editForm.getRawValue();

    try {
      await this.ingredientService.update(ingredient.id, { name: name.trim() });
      this.editingIngredient.set(null);
      this.editForm.reset();
      this.successMessage.set('Ingredient updated successfully.');
      await this.loadIngredients();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update ingredient.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteIngredient(ingredient: IIngredient): Promise<void> {
    const confirmed = confirm(`Delete ingredient "${ingredient.name}"?`);
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.ingredientService.delete(ingredient.id);
      this.successMessage.set('Ingredient deleted successfully.');
      if (this.editingIngredient()?.id === ingredient.id) {
        this.cancelEdit();
      }
      await this.loadIngredients();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete ingredient.'));
    }
  }
}
