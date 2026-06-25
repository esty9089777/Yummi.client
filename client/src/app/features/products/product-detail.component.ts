import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../core/models/product.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  readonly product = signal<IProduct | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly returnCategoryId = signal<string | null>(null);

  readonly backLink = computed(() => {
    const categoryId = this.returnCategoryId();
    return categoryId ? ['/categories', categoryId] : ['/menu'];
  });

  readonly backLabel = computed(() =>
    this.returnCategoryId() ? 'Back to category' : 'Back to menu',
  );

  ngOnInit(): void {
    this.returnCategoryId.set(this.route.snapshot.queryParamMap.get('categoryId'));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadProduct(id);
    } else {
      this.errorMessage.set('Product ID is missing.');
      this.isLoading.set(false);
    }
  }

  async loadProduct(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const item = await this.productService.getById(id);
      this.product.set(item);

      if (!this.returnCategoryId() && item.categories.length > 0) {
        this.returnCategoryId.set(item.categories[0]);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Product not found.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }

  formatExtraPrice(price: number): string {
    return price > 0 ? `+₪${price.toFixed(2)} per extra` : 'Free';
  }
}
