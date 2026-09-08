const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const CSRF_UNAVAILABLE_MESSAGE =
  'We could not securely start your submission. Please check your connection, wait a moment, and try again.';

const delay = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

// A form can upload several documents in parallel. Without a single-flight
// request, each /csrf-token response may set a different CSRF cookie and all
// but the last returned token become invalid before their uploads begin.
let csrfTokenRequest: Promise<string> | null = null;

export const getCSRFToken = async (): Promise<string> => {
  if (csrfTokenRequest) {
    return csrfTokenRequest;
  }

  csrfTokenRequest = fetchCSRFToken();

  try {
    return await csrfTokenRequest;
  } finally {
    csrfTokenRequest = null;
  }
};

const fetchCSRFToken = async (): Promise<string> => {
  const attempts = 3;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data?.csrfToken === 'string' && data.csrfToken.length > 0) {
          return data.csrfToken;
        }
      }
    } catch {
      // A brief retry also covers a Render instance waking up or a transient network loss.
    }

    if (attempt < attempts - 1) {
      await delay(500 * Math.pow(2, attempt));
    }
  }

  throw new Error(CSRF_UNAVAILABLE_MESSAGE);
};
