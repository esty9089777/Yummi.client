import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { ICategory } from '../../core/models/category.model';
import { getApiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessHoursService = inject(BusinessHoursService);

  readonly categories = signal<ICategory[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isOpen = signal(true);
  readonly closedReason = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.loadCategories();
    });
  }

  async loadCategories(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.ensureSessionInitialized();
      const [items, openStatus] = await Promise.all([
        this.categoryService.getAll(),
        this.businessHoursService.isOpenNow(),
      ]);
      this.categories.set(items);
      this.isOpen.set(openStatus.isOpen);
      this.closedReason.set(openStatus.isOpen ? null : openStatus.reason);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Failed to load menu categories.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToCategory(category: ICategory): void {
    const id = category.id?.trim();
    if (!id) {
      return;
    }

    void this.router.navigate(['/categories', id]);
  }
}
