import { Injectable, computed, signal } from '@angular/core';
import { ApiService } from './api.service';
import { TOKEN_KEY } from '../core/interceptors/auth.interceptor';
import { IUser } from '../core/models/user.model';
import { UserRole } from '../core/models/enums';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<IUser | null>(null);
  private readonly _activeRole = signal<UserRole | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly activeRole = this._activeRole.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  constructor(private readonly api: ApiService) {}

  // TODO: implement register(dto)
  // TODO: implement login(dto)
  // TODO: implement logout()
  // TODO: implement getMe()
  // TODO: implement switchActiveRole(role)

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
