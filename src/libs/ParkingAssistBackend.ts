import { getSession } from '@/libs/Session';

import 'server-only';

export function getParkingAssistBackendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
}

export async function getDimoTokenOrNull(): Promise<string | null> {
  const session = await getSession();
  const token = session?.dimoToken;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export async function fetchParkingAssistBackend<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; status: number } | { error: string; status: number }> {
  const dimoToken = await getDimoTokenOrNull();
  if (!dimoToken) {
    return { error: 'User not authenticated', status: 401 };
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${dimoToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getParkingAssistBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText) as { message?: string };
      message = parsed.message ?? errorText;
    } catch {
      // use raw text
    }
    return { error: message || `Request failed (${response.status})`, status: response.status };
  }

  const data = (await response.json()) as T;
  return { data, status: response.status };
}
