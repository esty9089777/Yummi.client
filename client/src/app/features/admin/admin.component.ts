import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../core/models/enums';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private readonly auth = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.activeRole() === UserRole.ADMIN);
}
