/**
 * Guest session for the no-account customer journey.
 *
 * The backend can require proof that a guest is a person before it runs paid checks (NIN/CAC,
 * document reading), uploads or a guest submission. When VITE_TURNSTILE_SITE_KEY is set, an
 * invisible Cloudflare Turnstile challenge is solved once and exchanged for a two-hour signed
 * session sent as `x-guest-session`. Without the key the session is issued without a challenge.
 *
 * Failures never block the caller: if no session can be obtained the request goes out without
 * the header and the backend decides (it only insists when Turnstile is configured there).
 */
import { API_BASE_URL } from '@/config/constants';

export const GUEST_SESSION_HEADER = 'x-guest-session';
const STORAGE_KEY = 'nemGuestSession';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

type StoredSession = { token: string; expiresAt: number };

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let pending: Promise<string | null> | null = null;

const readStored = (): StoredSession | null => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed?.token && parsed.expiresAt - REFRESH_MARGIN_MS > Date.now()) return parsed;
  } catch {
    // Storage unavailable or corrupt: fetch a fresh session.
  }
  return null;
};

const loadTurnstile = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

const solveTurnstile = async (siteKey: string): Promise<string> => {
  await loadTurnstile();
  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.bottom = '16px';
    host.style.right = '16px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);
    const cleanup = (widgetId?: string) => {
      if (widgetId) window.turnstile?.remove(widgetId);
      host.remove();
    };
    let widgetId: string | undefined;
    // 'interaction-only' stays invisible unless Cloudflare needs the visitor to click.
    widgetId = window.turnstile!.render(host, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      callback: (token: string) => { cleanup(widgetId); resolve(token); },
      'error-callback': () => { cleanup(widgetId); reject(new Error('Turnstile challenge failed')); },
      'timeout-callback': () => { cleanup(widgetId); reject(new Error('Turnstile challenge timed out')); },
    });
  });
};

const fetchSession = async (): Promise<string | null> => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  try {
    const turnstileToken = siteKey ? await solveTurnstile(siteKey) : undefined;
    const response = await fetch(`${API_BASE_URL}/api/public/guest-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken }),
    });
    if (!response.ok) return null;
    const session = await response.json() as StoredSession;
    if (!session?.token) return null;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: session.token, expiresAt: session.expiresAt }));
    } catch {
      // Private browsing: keep working without caching.
    }
    return session.token;
  } catch (error) {
    console.warn('Guest session unavailable:', error);
    return null;
  }
};

/** Headers to add to public (no-account) requests. Resolves to {} when no session is available. */
export const getGuestSessionHeaders = async (): Promise<Record<string, string>> => {
  const stored = readStored();
  if (stored) return { [GUEST_SESSION_HEADER]: stored.token };
  pending ??= fetchSession().finally(() => { pending = null; });
  const token = await pending;
  return token ? { [GUEST_SESSION_HEADER]: token } : {};
};

/** Drops the cached session, e.g. after the backend rejected it. */
export const clearGuestSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
