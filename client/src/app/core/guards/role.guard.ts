import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/enums';
import { AuthService } from '../../services/auth.service';

/**
 * Factory that returns a guard allowing only the specified roles.
 *
 * Usage in routes:
 *   canActivate: [roleGuard(UserRole.ADMIN, UserRole.KITCHEN)]
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.ensureSessionInitialized();

    const role = auth.activeRole();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
}
