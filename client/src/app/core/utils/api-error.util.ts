import { isAxiosError } from 'axios';

/** Extracts a human-readable message from an Axios / API error response. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string; details?: string[] }
      | undefined;

    if (data?.details?.length) {
      return data.details.join('. ');
    }

    return data?.message ?? data?.error ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
