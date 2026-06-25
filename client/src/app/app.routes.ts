import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/enums';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/employees',
    loadComponent: () =>
      import('./features/profile/employees/employee-management.component').then(
        (m) => m.EmployeeManagementComponent,
      ),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'admin/categories',
    loadComponent: () =>
      import('./features/admin/categories/category-management.component').then(
        (m) => m.CategoryManagementComponent,
      ),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'admin/ingredients',
    loadComponent: () =>
      import('./features/admin/ingredients/ingredient-management.component').then(
        (m) => m.IngredientManagementComponent,
      ),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'categories/:id',
    loadComponent: () =>
      import('./features/products/product-list.component').then((m) => m.ProductListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.component').then((m) => m.MenuComponent),
    canActivate: [authGuard],
  },
  {
    path: 'products',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [authGuard],
  },
  {
    path: 'kitchen',
    loadComponent: () =>
      import('./features/kitchen/kitchen.component').then((m) => m.KitchenComponent),
    canActivate: [authGuard, roleGuard(UserRole.KITCHEN, UserRole.ADMIN)],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
