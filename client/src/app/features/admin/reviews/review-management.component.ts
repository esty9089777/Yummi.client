import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ReviewService } from '../../../services/review.service';
import { IReview } from '../../../core/models/review.model';
import { ReviewType } from '../../../core/models/enums';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-review-management',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './review-management.component.html',
  styleUrl: './review-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewManagementComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  readonly ReviewType = ReviewType;
  readonly reviews = signal<IReview[]>([]);
  readonly isLoading = signal(true);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly displayedColumns = ['type', 'title', 'customer', 'rating', 'comment', 'createdAt', 'actions'];

  ngOnInit(): void {
    void this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const items = await this.reviewService.getAll();
      this.reviews.set(items.filter((review) => !review.isDeleted));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load reviews.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  typeLabel(type: ReviewType): string {
    return type === ReviewType.STORE ? 'Store' : 'Product';
  }

  targetLabel(review: IReview): string {
    if (review.type === ReviewType.PRODUCT && review.productName) {
      return review.productName;
    }
    if (review.orderId) {
      return `Order #${review.orderId.slice(-6).toUpperCase()}`;
    }
    return '—';
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  async deleteReview(review: IReview): Promise<void> {
    const confirmed = confirm(`Delete review "${review.title}" by ${review.customerName}?`);
    if (!confirmed) {
      return;
    }

    this.deletingId.set(review.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.reviewService.delete(review.id);
      this.reviews.update((items) => items.filter((item) => item.id !== review.id));
      this.successMessage.set('Review removed successfully.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to delete review.'));
    } finally {
      this.deletingId.set(null);
    }
  }
}
