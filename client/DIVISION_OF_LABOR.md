# Division of Labor — Angular Frontend (2 Developers)

This document splits the **Yummi.client** Angular work between two developers.  
Responsibilities are the **mirror opposite** of the backend (`Yummi.server/DIVISION_OF_LABOR.md`).

The shared **infrastructure** (Angular scaffold, `ApiService`, Axios interceptors, guards, models, environment config, Material theme, route shell, and empty service stubs) is already in place. Each developer fills in their domain on a dedicated branch.

---

## Shared Foundation (already provided)

- `src/environments/*` — `apiUrl`, `socketUrl`
- `src/app/services/api.service.ts` — Axios instance + auth interceptor wiring
- `src/app/core/interceptors/auth.interceptor.ts` — JWT header injection
- `src/app/core/guards/*` — `authGuard`, `roleGuard`
- `src/app/core/models/*` — enums and interfaces mirroring the server
- `src/app/app.config.ts` — router, hydration, animations
- `src/app/app.routes.ts` — lazy-loaded route shell
- `src/styles.scss` — Angular Material M3 theme
- `PROJECT_GUIDELINES.md` — architecture and conventions

> **Developer B owns Auth first** (login/register/profile). Everything else depends on a working JWT flow — build and merge auth before feature work begins.

---

## Developer A — Ordering, Delivery & Real-Time

*(On the server, Developer B owned cart, orders, notifications, stats, and Socket.IO.)*

Owns the customer ordering pipeline, delivery workflow, operational configuration used at checkout, notifications, and all real-time UI updates.

| Domain | Angular location | Services | Key responsibilities |
|---|---|---|---|
| Cart | `features/cart/` | `cart.service.ts` | View cart, add/update/remove items, validate extras |
| Checkout | `features/checkout/` | `cart.service.ts`, `order.service.ts`, `delivery-zone.service.ts`, `business-hours.service.ts` | Place order (DELIVERY / PICKUP), address + city validation, business-hours check |
| Order history | `features/orders/` | `order.service.ts` | Customer's own orders (`GET /orders/my`) |
| Order details | `features/orders/order-detail/` | `order.service.ts` | Single order view with immutable snapshots |
| Order status tracking | `features/orders/order-tracking/` | `order.service.ts` | Status timeline (RECEIVED → … → COMPLETED) |
| Delivery (shipments) | `features/delivery/` | `order.service.ts` | READY delivery orders list, mark COMPLETED `[DELIVERY]` |
| Delivery zones | `features/delivery-zones/` | `delivery-zone.service.ts` | City lookup, zone price + ETA display |
| Business hours | `features/business-hours/` | `business-hours.service.ts` | Weekly schedule display, `isOpenNow` indicator |
| Notifications | `features/notifications/` | `notification.service.ts` | In-app notification list, mark as read |
| Real-time (Socket.IO) | `core/services/socket.service.ts` | — | Connect on login, listen for order + availability events |

**Socket events consumed by Developer A:**

`ORDER_APPROVED`, `ORDER_IN_PREPARATION`, `ORDER_READY`, `ORDER_COMPLETED`, `ORDER_CANCELLED`, `KITCHEN_ISSUE_REPORTED`

**Suggested branch:** `developer-a/ordering-operations`

---

## Developer B — Auth, Catalog & Admin

*(On the server, Developer A owned users, categories, products, ingredients, delivery zones, business hours, and reviews.)*

Owns authentication, user management, the browsable menu/catalog, ingredients, reviews, and the admin statistics dashboard.

| Domain | Angular location | Services | Key responsibilities |
|---|---|---|---|
| Login & registration | `pages/login/`, `pages/register/` | `auth.service.ts` | Register (CUSTOMER), login, JWT storage, logout |
| User & profile | `features/profile/` | `auth.service.ts`, `user.service.ts` | `getMe`, switch active role, profile edit, employee CRUD `[ADMIN]` |
| Categories | `features/categories/` | `category.service.ts` | List, detail, admin CRUD |
| Products | `features/products/` | `product.service.ts` | List, detail, search/filter, admin CRUD, availability toggle |
| Ingredients (components) | `features/ingredients/` | `ingredient.service.ts` | List, status toggle `[KITCHEN, ADMIN]`, admin CRUD |
| Reviews | `features/reviews/` | `review.service.ts` | Submit review on COMPLETED order, admin list |
| Dashboard & statistics | `features/dashboard/` | `stats.service.ts` | Admin KPIs: revenue, top products, ratings, cancellations |

**Socket events consumed by Developer B:**

`PRODUCT_AVAILABILITY_CHANGED`, `INGREDIENT_AVAILABILITY_CHANGED`

**Suggested branch:** `developer-b/catalog-auth`

---

## Cross-Cutting Conventions (Angular)

- **Standalone components only** — no NgModules.
- **Signals for state** — use `signal()`, `computed()`, `effect()` in services; avoid RxJS subjects for local state.
- **Thin components** — all HTTP calls go through domain services → `ApiService`.
- **Authorize by `activeRole`** — use `roleGuard(UserRole.…)` in routes; never check `roles[]` directly.
- **Lazy loading** — every feature route uses `loadComponent`.
- **Material imports** — import only the modules each component needs in its `imports: []` array.

```typescript
// ✅ Modern Angular pattern
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  readonly products = this.productService.products; // readonly signal from service
}
```

---

## Suggested Order of Work

1. **(B)** Auth flow — login, register, `getMe`, role switch *(unblocks all protected routes)*.
2. **(B)** Categories + Products — menu browsing for customers.
3. **(B)** Ingredients — extras display on product detail.
4. **(A)** Cart → Checkout — add items, place order with snapshots.
5. **(A)** Delivery zones + Business hours — needed at checkout.
6. **(A)** Order history, details, status tracking.
7. **(A)** Socket service + notifications — real-time order updates.
8. **(A)** Delivery workflow — `[DELIVERY]` role UI.
9. **(B)** Reviews — after orders reach COMPLETED.
10. **(B)** Admin dashboard + employee management.

---

## Branch Strategy

| Branch | Owner | Purpose |
|---|---|---|
| `main` | Shared | Merged, stable infrastructure + integrated features |
| `developer-a/ordering-operations` | Developer A | Cart, orders, delivery, notifications, Socket.IO |
| `developer-b/catalog-auth` | Developer B | Auth, catalog, ingredients, reviews, dashboard |

Merge to `main` via pull request after review. Rebase on `main` before opening a PR.
