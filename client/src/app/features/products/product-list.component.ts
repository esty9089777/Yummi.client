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
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private paramSub: Subscription | null = null;
  private allProducts: IProduct[] = [];

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
    this.debounceTimer = setTimeout(() => this.applySearchFilter(), 350);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.applySearchFilter();
  }

  /** Loads category metadata and products filtered by route param id. */
  private async loadPage(categoryId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.category.set(null);
    this.products.set([]);
    this.allProducts = [];

    try {
      await this.auth.ensureSessionInitialized();

      const category = await this.categoryService.getById(categoryId);
      this.category.set(category);

      const items = await this.categoryService.listProducts(categoryId);
      this.allProducts = items;
      this.products.set(this.filterProducts(items));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load category products.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Applies the current search term to the cached product list. */
  private applySearchFilter(): void {
    this.products.set(this.filterProducts(this.allProducts));
  }

  private filterProducts(products: IProduct[]): IProduct[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term),
    );
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
