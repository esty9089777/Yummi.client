import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { environment } from '../../environments/environment';
import { authRequestInterceptor, TOKEN_KEY } from '../core/interceptors/auth.interceptor';
import { removeBrowserStorageItem } from '../core/utils/browser-storage.util';
import type { ApiResponse } from '../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly http: AxiosInstance;
  private unauthorizedHandler: (() => void) | undefined;

  constructor() {
    this.http = axios.create({
      baseURL: environment.apiUrl,
      withCredentials: false,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.request.use(authRequestInterceptor);

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          removeBrowserStorageItem(TOKEN_KEY);
          this.unauthorizedHandler?.();
        }
        return Promise.reject(error);
      },
    );
  }

  /** Called by AuthService so a 401 also clears in-memory session state. */
  registerUnauthorizedHandler(handler: () => void): void {
    this.unauthorizedHandler = handler;
  }

  /** Unwraps the Axios envelope and returns the `data` field of the API response body. */
  unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
    return response.data.data;
  }
}
