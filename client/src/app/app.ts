import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CustomerOrderCompletionService } from './services/customer-order-completion.service';
import { NavComponent } from './shared/components/nav/nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  // Ensures the customer completion redirect listener is active for the session.
  private readonly _customerOrderCompletion = inject(CustomerOrderCompletionService);

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.auth.ensureSessionInitialized();
  }
}
