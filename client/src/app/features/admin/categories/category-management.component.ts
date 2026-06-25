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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CategoryService } from '../../../services/category.service';
import { ICategory } from '../../../core/models/category.model';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-category-management',
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
  ],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManagementComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<ICategory[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingCategory = signal<ICategory | null>(null);

  readonly displayedColumns = ['name', 'description', 'actions'];

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.maxLength(2048)]],
  });

  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.maxLength(2048)]],
  });

  ngOnInit(): void {
    void this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const items = await this.categoryService.getAll();
      this.categories.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load categories.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((value) => !value);
    this.editingCategory.set(null);
    this.createForm.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  startEdit(category: ICategory): void {
    this.showCreateForm.set(false);
    this.editingCategory.set(category);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.editForm.patchValue({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
    });
  }

  cancelEdit(): void {
    this.editingCategory.set(null);
    this.editForm.reset();
  }

  async createCategory(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { name, description, image } = this.createForm.getRawValue();

    try {
      await this.categoryService.create({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(image.trim() ? { image: image.trim() } : {}),
      });

      this.createForm.reset();
      this.showCreateForm.set(false);
      this.successMessage.set('Category created successfully.');
      await this.loadCategories();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create category.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async saveEdit(): Promise<void> {
    const category = this.editingCategory();
    if (!category || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { name, description, image } = this.editForm.getRawValue();

    try {
      await this.categoryService.update(category.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });

      this.editingCategory.set(null);
      this.editForm.reset();
      this.successMessage.set('Category updated successfully.');
      await this.loadCategories();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update category.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteCategory(category: ICategory): Promise<void> {
    const confirmed = confirm(`Delete category "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.categoryService.delete(category.id);
      this.successMessage.set('Category deleted successfully.');
      if (this.editingCategory()?.id === category.id) {
        this.cancelEdit();
      }
      await this.loadCategories();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete category.'));
    }
  }
}
