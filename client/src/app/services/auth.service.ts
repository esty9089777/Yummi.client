import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { TOKEN_KEY } from '../core/interceptors/auth.interceptor';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  getBrowserStorageItem,
  removeBrowserStorageItem,
  setBrowserStorageItem,
} from '../core/utils/browser-storage.util';
import {
  IAuthPayload,
  ILoginDto,
  IMeResponse,
  IRegisterDto,
  ISwitchRoleDto,
  IUpdateProfileDto,
  IUser,
} from '../core/models/user.model';
import { UserRole } from '../core/models/enums';
import { SocketService } from '../core/services/socket.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);

  private readonly _currentUser = signal<IUser | null>(null);
  private readonly _activeRole = signal<UserRole | null>(null);

  /** Read-only signal: the authenticated user, or null when logged out. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Read-only signal: the user's active role from the current JWT. */
  readonly activeRole = this._activeRole.asReadonly();

  /** Derived signal: true when a user is authenticated. */
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  private sessionInitPromise: Promise<void> | null = null;

  constructor() {
    this.api.registerUnauthorizedHandler(() => this.logout());
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Ensures session restoration runs once before guards or auth checks. */
  ensureSessionInitialized(): Promise<void> {
    this.sessionInitPromise ??= this.initSession();
    return this.sessionInitPromise;
  }

  /**
   * Register a new CUSTOMER account.
   * On success, stores the JWT and populates the user/role signals.
   */
  async register(dto: IRegisterDto): Promise<IUser> {
    const res = await this.api.http.post<ApiResponse<IAuthPayload>>(
      '/auth/register',
      dto,
    );
    const { token, user } = this.api.unwrap(res);
    this._applySession(token, user);
    return user;
  }

  /**
   * Log in with email + password.
   * On success, stores the JWT and populates the user/role signals.
   */
  async login(dto: ILoginDto): Promise<IUser> {
    const res = await this.api.http.post<ApiResponse<IAuthPayload>>(
      '/auth/login',
      dto,
    );
    const { token, user } = this.api.unwrap(res);
    this._applySession(token, user);
    return user;
  }

  /**
   * Fetches the current user from GET /auth/me.
   * Used on app init to restore a session from an existing token.
   */
  async getMe(): Promise<IUser> {
    const res = await this.api.http.get<ApiResponse<IMeResponse>>('/auth/me');
    const { user } = this.api.unwrap(res);
    const token = getBrowserStorageItem(TOKEN_KEY) ?? '';
    this._applySession(token, user);
    return user;
  }

  /**
   * Switches the active role for the current session.
   * The server issues a new JWT with the updated activeRole.
   */
  async switchActiveRole(dto: ISwitchRoleDto): Promise<void> {
    const res = await this.api.http.patch<ApiResponse<IAuthPayload>>(
      '/auth/active-role',
      dto,
    );
    const { token, user } = this.api.unwrap(res);
    this._applySession(token, user);
  }

  /**
   * Updates the authenticated user's profile fields.
   */
  async updateProfile(dto: IUpdateProfileDto): Promise<IUser> {
    const res = await this.api.http.patch<ApiResponse<IMeResponse>>('/auth/me', dto);
    const { user } = this.api.unwrap(res);
    const token = getBrowserStorageItem(TOKEN_KEY) ?? '';
    this._applySession(token, user);
    return user;
  }

  /**
   * Clears the JWT, disconnects the socket, and resets all auth signals.
   */
  logout(): void {
    this.socketService.disconnect();
    removeBrowserStorageItem(TOKEN_KEY);
    this._currentUser.set(null);
    this._activeRole.set(null);
  }

  /**
   * Called once at application startup.
   * If a token already exists in localStorage, fetches the current user to
   * hydrate the signals — silently clears storage on any error (expired token).
   */
  async initSession(): Promise<void> {
    const token = getBrowserStorageItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      await this.getMe();
    } catch {
      this.logout();
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _applySession(token: string, user: IUser): void {
    if (token) {
      setBrowserStorageItem(TOKEN_KEY, token);
      this.socketService.connect(token);
    }
    this._currentUser.set(user);
    this._activeRole.set(this._decodeActiveRole(token));
  }

  /**
   * Decodes the JWT payload (base64) to read the activeRole claim.
   * No signature verification — we trust the server issued the token.
   */
  private _decodeActiveRole(token: string): UserRole | null {
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as {
        activeRole?: UserRole;
      };
      return payload.activeRole ?? null;
    } catch {
      return null;
    }
  }
}
