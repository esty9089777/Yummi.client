import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { StatsService } from '../../services/stats.service';
import { IDashboardStats } from '../../core/models/stats.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  readonly stats = signal<IDashboardStats | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly productColumns = ['rank', 'name', 'totalQuantity'];

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.stats.set(await this.statsService.getDashboard());
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load dashboard statistics.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return `₪${amount.toFixed(2)}`;
  }

  formatRating(rating: number): string {
    return rating > 0 ? `${rating.toFixed(2)} / 5` : 'No ratings yet';
  }

  starsDisplay(rating: number): string {
    if (rating <= 0) {
      return '—';
    }
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
