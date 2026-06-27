import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { UserRole } from '../../core/models/enums';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly businessHoursService = inject(BusinessHoursService);

  readonly UserRole = UserRole;
  readonly user = this.auth.currentUser;
  readonly activeRole = this.auth.activeRole;
  readonly isOpen = signal(true);
  readonly closedReason = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const openStatus = await this.businessHoursService.isOpenNow();
      this.isOpen.set(openStatus.isOpen);
      this.closedReason.set(openStatus.isOpen ? null : openStatus.reason);
    } catch {
      // silently ignore — store status is informational on the home page
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
