import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Prevents navigation to protected routes when the user is not authenticated.
 * Redirects to /login if the guard fails.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
