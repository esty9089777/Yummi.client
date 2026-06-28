import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ReviewService } from '../../services/review.service';
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
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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

  readonly reviews = signal<IReview[]>([]);
  readonly completedOrders = signal<IOrder[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedRating = signal(0);

  readonly isCustomer = computed(() => this.auth.activeRole() === UserRole.CUSTOMER);

  readonly averageRating = computed(() => {
    const items = this.reviews();
    if (items.length === 0) {
      return 0;
    }
    const sum = items.reduce((total, review) => total + review.rating, 0);
    return Math.round((sum / items.length) * 10) / 10;
  });

  readonly reviewableOrders = computed(() => {
    const reviewed = new Set(this.reviews().map((review) => review.orderId));
    return this.completedOrders().filter((order) => !reviewed.has(order._id));
  });

  readonly reviewForm = this.fb.nonNullable.group({
    orderId: ['', Validators.required],
    comment: ['', Validators.maxLength(1000)],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [reviews, orders] = await Promise.all([
        this.reviewService.getAll(),
        this.isCustomer() ? this.orderService.getMyOrders() : Promise.resolve([]),
      ]);

      this.reviews.set(reviews);

      if (this.isCustomer()) {
        this.completedOrders.set(
          orders.filter((order) => order.status === OrderStatus.COMPLETED),
        );
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load reviews.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  setRating(value: number): void {
    this.selectedRating.set(value);
  }

  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, index) => index + 1).map((star) =>
      star <= rating ? 1 : 0,
    );
  }

  shortOrderId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  async submitReview(): Promise<void> {
    if (this.reviewForm.invalid || this.selectedRating() === 0) {
      this.reviewForm.markAllAsTouched();
      if (this.selectedRating() === 0) {
        this.errorMessage.set('Please select a star rating.');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { orderId, comment } = this.reviewForm.getRawValue();
    const trimmedComment = comment.trim();

    try {
      const review = await this.reviewService.create({
        orderId,
        rating: this.selectedRating(),
        ...(trimmedComment ? { comment: trimmedComment } : {}),
      });

      this.reviews.update((items) => [review, ...items]);
      this.reviewForm.reset();
      this.selectedRating.set(0);
      this.successMessage.set('Thank you! Your review was submitted.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Could not submit your review.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
