import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadFile } from '../fileService';

describe('shared customer document upload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends FormData to the public upload endpoint without overriding its boundary', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'csrf-test-token' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ url: 'https://storage.example/document.pdf' })
      });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['%PDF-1.4 test'], 'certificate.pdf', { type: 'application/pdf' });
    await expect(uploadFile(file, 'corporate-kyc/certificate.pdf'))
      .resolves.toBe('https://storage.example/document.pdf');

    const [uploadUrl, uploadOptions] = fetchMock.mock.calls[1];
    expect(uploadUrl).toContain('/api/public/upload');
    expect(uploadOptions.method).toBe('POST');
    expect(uploadOptions.body).toBeInstanceOf(FormData);
    expect(uploadOptions.headers).toEqual({ 'CSRF-Token': 'csrf-test-token' });
    expect(uploadOptions.headers).not.toHaveProperty('Content-Type');
  });

  it('surfaces the backend upload reason to the form', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'csrf-test-token' })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'The document could not be stored.' })
      });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['%PDF-1.4 test'], 'certificate.pdf', { type: 'application/pdf' });
    await expect(uploadFile(file, 'corporate-kyc/certificate.pdf'))
      .rejects.toThrow('The document could not be stored.');
  });

  it('shares one CSRF token request across parallel first-time uploads', async () => {
    let releaseToken: ((value: unknown) => void) | undefined;
    const tokenResponse = new Promise(resolve => { releaseToken = resolve; });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/csrf-token')) return tokenResponse;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ url: `https://storage.example/${fetchMock.mock.calls.length}.pdf` })
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = uploadFile(new File(['one'], 'one.pdf', { type: 'application/pdf' }), 'motor-claims/one.pdf');
    const second = uploadFile(new File(['two'], 'two.pdf', { type: 'application/pdf' }), 'motor-claims/two.pdf');
    releaseToken?.({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ csrfToken: 'shared-token' })
    });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/csrf-token'))).toHaveLength(1);
    const uploads = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/public/upload'));
    expect(uploads).toHaveLength(2);
    expect(uploads.every(([, options]) => options.headers['CSRF-Token'] === 'shared-token')).toBe(true);
  });

  it('refreshes and retries once when an upload token is rejected', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ csrfToken: 'stale-token' }) })
      .mockResolvedValueOnce({ ok: false, status: 403, json: vi.fn().mockResolvedValue({ code: 'EBADCSRFTOKEN', message: 'invalid csrf token' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ csrfToken: 'fresh-token' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ url: 'https://storage.example/retried.pdf' }) });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['retry'], 'retry.pdf', { type: 'application/pdf' });
    await expect(uploadFile(file, 'motor-claims/retry.pdf'))
      .resolves.toBe('https://storage.example/retried.pdf');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3][1].headers).toEqual({ 'CSRF-Token': 'fresh-token' });
  });
});
