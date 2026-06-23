import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.component').then((m) => m.MenuComponent),
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
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
