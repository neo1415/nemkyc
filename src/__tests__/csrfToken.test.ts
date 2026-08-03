import { afterEach, describe, expect, it, vi } from 'vitest';
import { CSRF_UNAVAILABLE_MESSAGE, getCSRFToken } from '../utils/csrfToken';

describe('CSRF token retrieval', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns a token from the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ csrfToken: 'valid-token' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCSRFToken()).resolves.toBe('valid-token');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/csrf-token'),
      { credentials: 'include' },
    );
  });

  it('never exposes a raw backend status after retries fail', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const rejection = expect(getCSRFToken()).rejects.toThrow(CSRF_UNAVAILABLE_MESSAGE);
    await vi.runAllTimersAsync();
    await rejection;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
