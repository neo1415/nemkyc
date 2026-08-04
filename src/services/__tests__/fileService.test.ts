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
});
