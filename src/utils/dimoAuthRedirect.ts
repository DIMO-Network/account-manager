const DEFAULT_POST_AUTH_PATH = '/dashboard';

/** UUID v4-style id from Postgres `gen_random_uuid()`. */
const UUID_SEGMENT = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PARKING_SESSION_PATH = new RegExp(`^/parking/sessions/${UUID_SEGMENT}$`, 'i');

export function isValidParkingSessionId(id: string): boolean {
  return new RegExp(`^${UUID_SEGMENT}$`, 'i').test(id);
}

/**
 * Resolves a safe in-app path after `/api/dimo-auth` succeeds.
 * Only same-origin relative paths on an allowlist are permitted; otherwise `/dashboard`.
 */
export function resolveDimoAuthRedirectPath(redirectParam: string | null): string {
  if (!redirectParam?.trim()) {
    return DEFAULT_POST_AUTH_PATH;
  }

  let path: string;
  try {
    path = decodeURIComponent(redirectParam.trim());
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (
    !path.startsWith('/')
    || path.startsWith('//')
    || path.includes('://')
    || path.includes('?')
    || path.includes('#')
    || path.includes('\\')
  ) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (PARKING_SESSION_PATH.test(path)) {
    return path;
  }

  return DEFAULT_POST_AUTH_PATH;
}
