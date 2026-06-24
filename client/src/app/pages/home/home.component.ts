import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../core/models/enums';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly activeRole = this.auth.activeRole;
  readonly isAdmin = computed(() => this.auth.activeRole() === UserRole.ADMIN);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
