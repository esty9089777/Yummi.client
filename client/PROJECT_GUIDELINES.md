# Yummi Client — Project Guidelines

Angular 21 frontend for the Yummi Food Ordering Management System.  
Backend API: `http://localhost:5000/api` (dev) | Socket.IO: `http://localhost:5000`.

> **Team division of labor:** see [`DIVISION_OF_LABOR.md`](./DIVISION_OF_LABOR.md).

---

## Folder Structure

```
src/
├── environments/             # Environment-specific config (apiUrl, socketUrl)
└── app/
    ├── core/
    │   ├── models/           # TypeScript interfaces & enums mirroring the server
    │   ├── interceptors/     # Axios request/response interceptors
    │   ├── guards/           # Route guards (auth, role)
    │   └── services/         # Cross-cutting services (e.g. Socket.IO) — Dev A
    ├── shared/
    │   ├── components/       # Reusable dumb components
    │   ├── pipes/            # Custom Angular pipes
    │   └── directives/       # Custom Angular directives
    ├── features/             # Lazy-loaded feature areas (see DIVISION_OF_LABOR.md)
    │   ├── cart/             # Dev A
    │   ├── checkout/         # Dev A
    │   ├── orders/           # Dev A — history, detail, tracking
    │   ├── delivery/         # Dev A — shipment workflow
    │   ├── delivery-zones/   # Dev A
    │   ├── business-hours/   # Dev A
    │   ├── notifications/    # Dev A
    │   ├── profile/          # Dev B
    │   ├── categories/       # Dev B
    │   ├── products/         # Dev B — list, detail, search
    │   ├── ingredients/      # Dev B — product components / extras
    │   ├── reviews/          # Dev B
    │   └── dashboard/        # Dev B — admin statistics
    ├── pages/                # Routed page shells
    │   ├── home/
    │   ├── login/            # Dev B
    │   ├── register/         # Dev B
    │   └── not-found/
    └── services/             # Injectable API services (one per backend resource)
```

---

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `core/models/` | Pure TypeScript interfaces and enums — no Angular dependencies. Mirror the server's Mongoose models exactly. |
| `core/interceptors/` | Axios-level cross-cutting concerns (auth header injection, 401 handling). |
| `core/guards/` | Angular route guards. Always use `activeRole` from `AuthService`, never check `roles[]` directly. |
| `core/services/` | App-wide singletons such as Socket.IO — owned by Developer A. |
| `shared/` | Presentational, reusable building blocks with no business logic. |
| `features/` | Self-contained vertical slices; each owns its sub-components, local state, and routes. |
| `pages/` | Routed entry points. Thin shells — delegate all logic to features or services. |
| `services/` | All HTTP calls live here, through `ApiService`. One service per backend resource. |

---

## Key Architectural Decisions

### HTTP Client — Axios

All API calls go through `ApiService` (`src/app/services/api.service.ts`), which holds a shared Axios instance.

- **Do not** call `axios` directly from components or other services.
- Every service receives `ApiService` via constructor injection and calls `this.api.http.get(...)` etc.
- Use `this.api.unwrap(response)` to extract the `data` field from the standard `{ success, data }` envelope.

```typescript
// ✅ Correct pattern
const res = await this.api.http.get<ApiResponse<ICategory[]>>('/categories');
return this.api.unwrap(res);
```

### Authentication

- JWT is stored in `localStorage` under the key `yummi_token` (exported as `TOKEN_KEY`).
- The `authRequestInterceptor` (registered on the Axios instance) attaches it automatically.
- `AuthService` exposes signals: `currentUser`, `activeRole`, `isLoggedIn`.
- **Always** authorize using `activeRole`, not the `roles[]` array.

### Reactive State — Angular Signals

Use Angular Signals for all service-level state. Do **not** use `BehaviorSubject` or `ReplaySubject`.

```typescript
// ✅ Signals pattern (modern Angular)
private readonly _items = signal<IProduct[]>([]);
readonly items = this._items.asReadonly();
readonly count = computed(() => this._items().length);
```

### Component Pattern — Standalone + inject()

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;
}
```

### Routing

- All routes use `loadComponent` for lazy loading.
- Protected routes use `canActivate: [authGuard]`.
- Role-restricted routes use `canActivate: [roleGuard(UserRole.ADMIN)]`.
- Routes live in `app.routes.ts` (top-level), with nested routes defined inside each `features/` folder as needed.

### Angular Material

- Providers: `provideAnimationsAsync()` is registered in `app.config.ts`.
- Theme: orange/red M3 light theme defined in `src/styles.scss`.
- Import individual Material modules inside each component's `imports: []` array.

### Environments

| File | Used when |
|---|---|
| `src/environments/environment.ts` | `ng serve` (development) |
| `src/environments/environment.prod.ts` | `ng build` (production) |

Always import from `../../environments/environment` — the Angular build system swaps the file at build time.

---

## User Roles

| Role | Can access |
|---|---|
| `CUSTOMER` | Home, Menu, Cart, Checkout, Orders (own), Reviews |
| `KITCHEN` | Kitchen orders, ingredient status |
| `DELIVERY` | Delivery shipments |
| `ADMIN` | Everything + User management + Dashboard |

A user may have multiple roles; only `activeRole` (from JWT) is used for authorization decisions.

---

## Backend API Summary

Base URL: `http://localhost:5000/api`

| Resource | Endpoint prefix | Primary owner |
|---|---|---|
| Auth | `/auth` | Dev B |
| Users (employees) | `/users` | Dev B |
| Categories | `/categories` | Dev B |
| Products | `/products` | Dev B |
| Ingredients | `/ingredients` | Dev B |
| Delivery zones | `/delivery-zones` | Dev A |
| Business hours | `/business-hours` | Dev A |
| Reviews | `/reviews` | Dev B |
| Cart | `/cart` | Dev A |
| Orders | `/orders` | Dev A |
| Notifications | `/notifications` | Dev A |
| Stats | `/stats` | Dev B |

Public endpoints (no JWT): `POST /auth/register`, `POST /auth/login`.  
All others require `Authorization: Bearer <token>`.

---

## How to Add a New Feature

1. Check [`DIVISION_OF_LABOR.md`](./DIVISION_OF_LABOR.md) — confirm your domain and branch.
2. Create a folder under `src/app/features/<feature-name>/`.
3. Add a standalone component (`<feature>.component.ts`) with `ChangeDetectionStrategy.OnPush`.
4. Create or extend the corresponding service under `src/app/services/`.
5. Add TypeScript interfaces to `src/app/core/models/` if new server types are involved.
6. Register the route in `src/app/app.routes.ts` with `loadComponent` and appropriate guards.
7. Add shared sub-components to `src/app/shared/components/` if they will be reused across features.

---

## Running the Project

```bash
# Backend (Yummi.server/)
npm run dev          # ts-node-dev, port 5000

# Frontend (Yammi.client/client/)
npm start            # ng serve, port 4200
```

---

## Code Conventions

- File naming: `kebab-case.type.ts` (e.g. `order.service.ts`, `auth.guard.ts`).
- Component selectors: `app-<name>` prefix.
- One class per file.
- Prefer `inject()` over constructor injection in components.
- Prefer signals over `ngOnInit` for reactive state; use `afterNextRender` for DOM-dependent init.
- No business logic in components — delegate to services.
