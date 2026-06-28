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
    path: 'admin/delivery-zones',
    loadComponent: () =>
      import('./features/admin/delivery-zones/delivery-zone-management.component').then(
        (m) => m.DeliveryZoneManagementComponent,
      ),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'business-hours',
    loadComponent: () =>
      import('./features/business-hours/business-hours.component').then(
        (m) => m.BusinessHoursComponent,
      ),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.component').then((m) => m.MenuComponent),
    canActivate: [authGuard],
  },
  {
    path: 'categories/:id',
    loadComponent: () =>
      import('./features/products/product-list.component').then(
        (m) => m.ProductListComponent,
      ),
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
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart.component').then((m) => m.CartComponent),
    canActivate: [authGuard, roleGuard(UserRole.CUSTOMER)],
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [authGuard, roleGuard(UserRole.CUSTOMER)],
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [authGuard],
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'kitchen',
    loadComponent: () =>
      import('./features/kitchen/kitchen.component').then((m) => m.KitchenComponent),
    canActivate: [authGuard, roleGuard(UserRole.KITCHEN, UserRole.ADMIN)],
  },
  {
    path: 'delivery',
    loadComponent: () =>
      import('./features/delivery/delivery.component').then((m) => m.DeliveryComponent),
    canActivate: [authGuard, roleGuard(UserRole.DELIVERY, UserRole.ADMIN)],
  },
  {
    path: 'delivery-zones',
    loadComponent: () =>
      import('./features/delivery-zones/delivery-zones.component').then(
        (m) => m.DeliveryZonesComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
  },
  {
    path: 'admin/operations',
    loadComponent: () =>
      import('./features/admin/operations/operations.component').then((m) => m.OperationsComponent),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
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
