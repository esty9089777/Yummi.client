import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CategoryService } from '../../../services/category.service';
import { IngredientService } from '../../../services/ingredient.service';
import { ProductService } from '../../../services/product.service';
import { ICategory } from '../../../core/models/category.model';
import { IIngredient } from '../../../core/models/ingredient.model';
import { IProduct } from '../../../core/models/product.model';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagementComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly ingredientService = inject(IngredientService);
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<ICategory[]>([]);
  readonly ingredients = signal<IIngredient[]>([]);
  readonly products = signal<IProduct[]>([]);
  readonly selectedCategoryId = signal<string>('');

  readonly isLoading = signal(true);
  readonly isLoadingProducts = signal(false);
  readonly isSubmitting = signal(false);
  readonly togglingAvailabilityId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly editingProduct = signal<IProduct | null>(null);

  readonly displayedColumns = ['name', 'price', 'components', 'extras', 'availability', 'actions'];

  readonly createForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    description: ['', Validators.maxLength(1000)],
    image: ['', Validators.maxLength(2048)],
    price: [0, [Validators.required, Validators.min(0)]],
    ingredients: this.fb.nonNullable.control<string[]>([]),
    allowedExtras: this.fb.nonNullable.control<string[]>([]),
    freeExtrasCount: [0, [Validators.min(0)]],
    pricePerExtra: [0, [Validators.min(0)]],
  });

  readonly editForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    description: ['', Validators.maxLength(1000)],
    image: ['', Validators.maxLength(2048)],
    price: [0, [Validators.required, Validators.min(0)]],
    ingredients: this.fb.nonNullable.control<string[]>([]),
    allowedExtras: this.fb.nonNullable.control<string[]>([]),
    freeExtrasCount: [0, [Validators.min(0)]],
    pricePerExtra: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    void this.loadReferenceData();
  }

  async loadReferenceData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [categories, ingredients] = await Promise.all([
        this.categoryService.getAll(),
        this.ingredientService.getAll(),
      ]);
      this.categories.set(categories);
      this.ingredients.set(ingredients);

      if (categories.length > 0) {
        const firstCategoryId = categories[0].id;
        this.selectedCategoryId.set(firstCategoryId);
        this.createForm.patchValue({ categoryId: firstCategoryId });
        await this.loadProducts(firstCategoryId);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load catalog data.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadProducts(categoryId: string): Promise<void> {
    if (!categoryId) {
      this.products.set([]);
      return;
    }

    this.isLoadingProducts.set(true);
    try {
      this.products.set(await this.categoryService.listProducts(categoryId));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load products.'));
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  async onCategoryChange(categoryId: string): Promise<void> {
    this.selectedCategoryId.set(categoryId);
    this.createForm.patchValue({ categoryId });
    this.cancelEdit();
    await this.loadProducts(categoryId);
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((value) => !value);
    this.editingProduct.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  ingredientName(id: string): string {
    return this.ingredients().find((item) => item.id === id)?.name ?? id;
  }

  componentSummary(product: IProduct): string {
    if (product.ingredients.length === 0) {
      return '—';
    }
    return product.ingredients.map((id) => this.ingredientName(id)).join(', ');
  }

  extrasSummary(product: IProduct): string {
    if (product.allowedExtras.length === 0) {
      return '—';
    }
    return product.allowedExtras.map((id) => this.ingredientName(id)).join(', ');
  }

  startEdit(product: IProduct): void {
    this.showCreateForm.set(false);
    this.editingProduct.set(product);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.editForm.patchValue({
      categoryId: product.categories[0] ?? this.selectedCategoryId(),
      name: product.name,
      description: product.description ?? '',
      image: product.image ?? '',
      price: product.price,
      ingredients: [...product.ingredients],
      allowedExtras: [...product.allowedExtras],
      freeExtrasCount: product.freeExtrasCount,
      pricePerExtra: product.pricePerExtra,
    });
  }

  cancelEdit(): void {
    this.editingProduct.set(null);
    this.editForm.reset();
  }

  private buildProductPayload(form: typeof this.createForm): {
    name: string;
    description?: string;
    image?: string;
    price: number;
    categories: string[];
    ingredients: string[];
    allowedExtras: string[];
    freeExtrasCount: number;
    pricePerExtra: number;
  } {
    const {
      categoryId,
      name,
      description,
      image,
      price,
      ingredients,
      allowedExtras,
      freeExtrasCount,
      pricePerExtra,
    } = form.getRawValue();

    return {
      name: name.trim(),
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      price: Number(price),
      categories: [categoryId],
      ingredients,
      allowedExtras,
      freeExtrasCount: Number(freeExtrasCount),
      pricePerExtra: Number(pricePerExtra),
    };
  }

  async createProduct(): Promise<void> {
    if (this.createForm.invalid || this.isSubmitting()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { categoryId, name } = this.createForm.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.productService.create(this.buildProductPayload(this.createForm));
      this.successMessage.set(`Product "${name.trim()}" created successfully.`);
      this.createForm.patchValue({
        name: '',
        description: '',
        image: '',
        price: 0,
        ingredients: [],
        allowedExtras: [],
        freeExtrasCount: 0,
        pricePerExtra: 0,
        categoryId,
      });
      this.showCreateForm.set(false);
      await this.loadProducts(categoryId);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to create product.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async saveEdit(): Promise<void> {
    const product = this.editingProduct();
    if (!product || this.editForm.invalid || this.isSubmitting()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { categoryId, name } = this.editForm.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.productService.update(product.id, this.buildProductPayload(this.editForm));
      this.successMessage.set(`Product "${name.trim()}" updated successfully.`);
      this.cancelEdit();
      this.selectedCategoryId.set(categoryId);
      await this.loadProducts(categoryId);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update product.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleAvailability(product: IProduct): Promise<void> {
    this.togglingAvailabilityId.set(product.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.productService.setAvailability(product.id, !product.isAvailable);
      this.successMessage.set(
        `"${product.name}" is now ${product.isAvailable ? 'unavailable' : 'available'}.`,
      );
      await this.loadProducts(this.selectedCategoryId());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to update availability.'));
    } finally {
      this.togglingAvailabilityId.set(null);
    }
  }
}
