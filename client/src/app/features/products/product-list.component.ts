import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { IProduct } from '../../core/models/product.model';
import { ICategory } from '../../core/models/category.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private paramSub: Subscription | null = null;

  readonly products = signal<IProduct[]>([]);
  readonly category = signal<ICategory | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly categoryId = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.paramSub = this.route.paramMap.subscribe((params) => {
        const id = params.get('id')?.trim();
        if (!id) {
          void this.router.navigate(['/menu']);
          return;
        }

        this.categoryId.set(id);
        this.searchTerm.set('');
        void this.loadPage(id);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.paramSub?.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => void this.reloadProducts(), 350);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    void this.reloadProducts();
  }

  /** Loads category metadata and products filtered by route param id. */
  private async loadPage(categoryId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.category.set(null);
    this.products.set([]);

    try {
      await this.auth.ensureSessionInitialized();

      const category = await this.categoryService.getById(categoryId);
      this.category.set(category);

      const items = await this.productService.getAll({
        categoryId,
        search: this.searchTerm() || undefined,
      });
      this.products.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load category products.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Re-fetches products for the current category (search filter changes). */
  private async reloadProducts(): Promise<void> {
    const categoryId = this.categoryId();
    if (!categoryId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.ensureSessionInitialized();

      const items = await this.productService.getAll({
        categoryId,
        search: this.searchTerm() || undefined,
      });
      this.products.set(items);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load products.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToProduct(productId: string): void {
    void this.router.navigate(['/products', productId], {
      queryParams: { categoryId: this.categoryId() },
    });
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }
}
