import type { InternalAxiosRequestConfig } from 'axios';
import { getBrowserStorageItem } from '../utils/browser-storage.util';

const TOKEN_KEY = 'yummi_token';

/**
 * Axios request interceptor that attaches the JWT to every outgoing request.
 * Register this on the shared Axios instance inside ApiService.
 */
export function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = getBrowserStorageItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}

export { TOKEN_KEY };
