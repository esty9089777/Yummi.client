import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../services/product.service';
import { IngredientService } from '../../services/ingredient.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { ReviewService } from '../../services/review.service';
import { OrderService } from '../../services/order.service';
import { IProduct } from '../../core/models/product.model';
import { IIngredient } from '../../core/models/ingredient.model';
import { IReview } from '../../core/models/review.model';
import { IngredientStatus, OrderStatus, ReviewType, UserRole } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

interface ExtraOption {
  id: string;
  name: string;
  available: boolean;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly ingredientService = inject(IngredientService);
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly businessHoursService = inject(BusinessHoursService);
  private readonly reviewService = inject(ReviewService);
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);

  readonly product = signal<IProduct | null>(null);
  readonly productReviews = signal<IReview[]>([]);
  readonly canReviewProduct = signal(false);
  readonly isSubmittingReview = signal(false);
  readonly reviewSuccessMessage = signal<string | null>(null);
  readonly reviewErrorMessage = signal<string | null>(null);
  readonly selectedReviewRating = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly returnCategoryId = signal<string | null>(null);

  readonly extraOptions = signal<ExtraOption[]>([]);
  readonly selectedExtraIds = signal<string[]>([]);
  readonly quantity = signal(1);

  readonly isAddingToCart = signal(false);
  readonly addToCartError = signal<string | null>(null);
  readonly addedToCart = signal(false);

  readonly isOpen = signal(true);
  readonly closedReason = signal<string | null>(null);

  readonly isCustomer = computed(() => this.auth.activeRole() === UserRole.CUSTOMER);

  readonly averageProductRating = computed(() => {
    const items = this.productReviews();
    if (items.length === 0) {
      return 0;
    }
    const sum = items.reduce((total, review) => total + review.rating, 0);
    return Math.round((sum / items.length) * 10) / 10;
  });

  readonly reviewForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    comment: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
  });

  readonly canOrder = computed(
    () => this.isCustomer() && (this.product()?.isAvailable ?? false) && this.isOpen(),
  );

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
      const [item, openStatus] = await Promise.all([
        this.productService.getById(id),
        this.businessHoursService.isOpenNow(),
      ]);
      this.product.set(item);
      this.isOpen.set(openStatus.isOpen);
      this.closedReason.set(openStatus.isOpen ? null : openStatus.reason);

      if (!this.returnCategoryId() && item.categories.length > 0) {
        this.returnCategoryId.set(item.categories[0]);
      }

      if (item.allowedExtras.length > 0) {
        await this.loadExtraOptions(item);
      }

      await this.loadProductReviews(id);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Product not found.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  isExtraSelected(id: string): boolean {
    return this.selectedExtraIds().includes(id);
  }

  toggleExtra(id: string, checked: boolean): void {
    this.addedToCart.set(false);
    this.selectedExtraIds.update((ids) =>
      checked ? [...ids, id] : ids.filter((existing) => existing !== id),
    );
  }

  changeQuantity(delta: number): void {
    this.addedToCart.set(false);
    this.quantity.update((value) => Math.max(1, value + delta));
  }

  async addToCart(): Promise<void> {
    const item = this.product();
    if (!item || !this.canOrder()) {
      return;
    }

    this.isAddingToCart.set(true);
    this.addToCartError.set(null);
    this.addedToCart.set(false);

    try {
      await this.cartService.addItem({
        productId: item.id,
        quantity: this.quantity(),
        selectedExtras: this.selectedExtraIds(),
      });
      this.addedToCart.set(true);
      this.quantity.set(1);
      this.selectedExtraIds.set([]);
    } catch (error) {
      this.addToCartError.set(getApiErrorMessage(error, 'Could not add this item to the cart.'));
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  formatPrice(price: number): string {
    return `₪${price.toFixed(2)}`;
  }

  formatExtraPrice(price: number): string {
    return price > 0 ? `+₪${price.toFixed(2)} per extra` : 'Free';
  }

  setReviewRating(value: number): void {
    this.selectedReviewRating.set(value);
  }

  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, index) => index + 1).map((star) =>
      star <= rating ? 1 : 0,
    );
  }

  async submitProductReview(): Promise<void> {
    const item = this.product();
    if (!item || this.reviewForm.invalid || this.selectedReviewRating() === 0) {
      this.reviewForm.markAllAsTouched();
      if (this.selectedReviewRating() === 0) {
        this.reviewErrorMessage.set('Please select a star rating.');
      }
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewErrorMessage.set(null);
    this.reviewSuccessMessage.set(null);

    const { title, comment } = this.reviewForm.getRawValue();

    try {
      const review = await this.reviewService.create({
        type: ReviewType.PRODUCT,
        productId: item.id,
        title: title.trim(),
        rating: this.selectedReviewRating(),
        comment: comment.trim(),
      });

      this.productReviews.update((reviews) => [review, ...reviews]);
      this.canReviewProduct.set(false);
      this.reviewForm.reset();
      this.selectedReviewRating.set(0);
      this.reviewSuccessMessage.set('Thank you! Your product review was published.');
    } catch (error) {
      this.reviewErrorMessage.set(getApiErrorMessage(error, 'Could not submit your review.'));
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  private async loadProductReviews(productId: string): Promise<void> {
    try {
      const reviews = await this.reviewService.getProductReviews(productId);
      this.productReviews.set(reviews);

      if (!this.isCustomer()) {
        this.canReviewProduct.set(false);
        return;
      }

      const currentUserId = this.auth.currentUser()?.id;
      const alreadyReviewed = reviews.some((review) => review.customerId === currentUserId);
      if (alreadyReviewed) {
        this.canReviewProduct.set(false);
        return;
      }

      const orders = await this.orderService.getMyOrders();
      const hasCompletedOrder = orders.some(
        (order) =>
          order.status === OrderStatus.COMPLETED &&
          order.items.some((line) => line.productId === productId),
      );
      this.canReviewProduct.set(hasCompletedOrder);
    } catch {
      this.productReviews.set([]);
      this.canReviewProduct.set(false);
    }
  }

  private async loadExtraOptions(item: IProduct): Promise<void> {
    try {
      const ingredients = await this.ingredientService.getAll();
      const byId = new Map<string, IIngredient>(
        ingredients.map((ingredient) => [ingredient.id, ingredient as IIngredient]),
      );

      const options: ExtraOption[] = item.allowedExtras.map((id) => {
        const ingredient = byId.get(id);
        return {
          id,
          name: ingredient?.name ?? 'Extra',
          available: ingredient ? ingredient.status === IngredientStatus.AVAILABLE : false,
        };
      });

      this.extraOptions.set(options);
    } catch {
      // Extras are optional; fall back to no add-on selection on failure.
      this.extraOptions.set([]);
    }
  }
}
