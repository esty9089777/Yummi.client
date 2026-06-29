import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { ReviewService } from '../../services/review.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { IReview } from '../../core/models/review.model';
import { IOrder } from '../../core/models/order.model';
import { OrderStatus, UserRole } from '../../core/models/enums';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    StarRatingComponent,
  ],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly UserRole = UserRole;

  readonly reviews = signal<IReview[]>([]);
  readonly myOrders = signal<IOrder[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly activeRole = this.auth.activeRole;
  readonly isCustomer = computed(() => this.activeRole() === UserRole.CUSTOMER);
  readonly isAdmin = computed(() => this.activeRole() === UserRole.ADMIN);
  readonly isKitchen = computed(() => this.activeRole() === UserRole.KITCHEN);
  readonly canSubmit = computed(() => this.isCustomer() && this.reviewableOrders().length > 0);

  readonly reviewableOrders = computed(() => {
    const reviewedOrderIds = new Set(this.reviews().map((review) => review.orderId));
    return this.myOrders().filter(
      (order) => order.status === OrderStatus.COMPLETED && !reviewedOrderIds.has(order._id),
    );
  });

  readonly displayedColumns = computed(() =>
    this.isAdmin() ? ['order', 'rating', 'comment', 'date', 'actions'] : ['order', 'rating', 'comment', 'date'],
  );

  readonly reviewForm = this.fb.nonNullable.group({
    orderId: ['', Validators.required],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', Validators.maxLength(1000)],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const reviewsPromise = this.reviewService.getAll();
      const ordersPromise = this.isCustomer() ? this.orderService.getMyOrders() : Promise.resolve([]);

      const [reviews, orders] = await Promise.all([reviewsPromise, ordersPromise]);
      this.reviews.set(reviews);
      this.myOrders.set(orders);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load reviews.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitReview(): Promise<void> {
    if (this.reviewForm.invalid || this.isSubmitting()) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const { orderId, rating, comment } = this.reviewForm.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const review = await this.reviewService.create({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      this.reviews.update((items) => [review, ...items]);
      this.reviewForm.reset({ orderId: '', rating: 5, comment: '' });
      this.successMessage.set('Thank you! Your review was submitted.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to submit review.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteReview(review: IReview): Promise<void> {
    const confirmed = confirm('Delete this review? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    this.deletingId.set(review.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.reviewService.delete(review.id);
      this.reviews.update((items) => items.filter((item) => item.id !== review.id));
      this.successMessage.set('Review deleted.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete review.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  orderLabel(orderId: string): string {
    return `#${this.shortId(orderId)}`;
  }
}
