import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Prevents authenticated users from accessing guest-only routes (login / register).
 * Redirects to home when a session already exists.
 */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSessionInitialized();

  if (!auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
