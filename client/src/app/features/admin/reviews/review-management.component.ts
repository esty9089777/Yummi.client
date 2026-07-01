import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ReviewService } from '../../../services/review.service';
import { IReview } from '../../../core/models/review.model';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-review-management',
  standalone: true,
  imports: [DatePipe, RouterLink, MatCardModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './review-management.component.html',
  styleUrl: './review-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewManagementComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  readonly reviews = signal<IReview[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly displayedColumns = ['order', 'customer', 'rating', 'comment', 'createdAt'];

  ngOnInit(): void {
    void this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.reviews.set(await this.reviewService.getAll());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load reviews.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  orderLabel(review: IReview): string {
    return `Order #${review.orderId.slice(-6).toUpperCase()}`;
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
