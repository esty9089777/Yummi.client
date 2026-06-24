/** SSR-safe localStorage helpers — no-op on the server. */
export function getBrowserStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

export function setBrowserStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(key, value);
}

export function removeBrowserStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(key);
}
