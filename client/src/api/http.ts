const base = import.meta.env.VITE_API_URL || '/api/v1';
let accessToken: string | null = null;
let onSessionLost = () => {};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const setSessionLostHandler = (handler: () => void) => {
  onSessionLost = handler;
};
type Session = { accessToken: string; user: import('../types').User };
let refreshPromise: Promise<Session> | null = null;
export function refreshSession(): Promise<Session> {
  if (!refreshPromise)
    refreshPromise = request<Session>(
      '/auth/refresh',
      { method: 'POST' },
      false,
    )
      .then((session) => {
        setAccessToken(session.accessToken);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError(
      0,
      'Cannot reach ProjectHub. Check your connection and make sure the server is running.',
    );
  }
  if (res.status === 401 && retry && accessToken) {
    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      onSessionLost();
      throw new ApiError(401, 'Your session expired. Please log in again.');
    }
    return request<T>(path, options, false);
  }
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    message?: string;
  } | null;
  if (!res.ok || !json?.success)
    throw new ApiError(
      res.status,
      json?.message || 'The request could not be completed.',
    );
  return json.data as T;
}
export const body = (data: unknown) => JSON.stringify(data);
