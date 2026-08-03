import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_CUSTOMER_FORM_TYPES } from '../config/customerForms';
import { useEnhancedFormSubmit } from '../hooks/useEnhancedFormSubmit';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

const successResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

describe('anonymous customer submission flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each(PUBLIC_CUSTOMER_FORM_TYPES)(
    'submits %s without authentication or a CSRF-token dependency',
    async formType => {
      const fetchMock = vi.fn().mockResolvedValue(successResponse({
        success: true,
        ticketId: 'TST-12345678',
      }));
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useEnhancedFormSubmit({
        formType,
        // These tests isolate submission transport; provider matching is covered below.
        verificationData: { isVerified: true },
      }));

      await act(async () => {
        await result.current.handleSubmit({ emailAddress: 'customer@example.com' });
      });
      expect(result.current.showSummary).toBe(true);

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(result.current.showSuccess).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/api/submit-form');
      expect(options.headers).not.toHaveProperty('CSRF-Token');
      expect(JSON.parse(options.body)).toMatchObject({ formType });
    },
  );

  it('verifies and matches NIN data before submitting Individual KYC', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse({
        status: true,
        data: {
          firstName: 'Ada',
          surname: 'Okafor',
          birthdate: '1990-05-15',
          gender: 'Female',
        },
      }))
      .mockResolvedValueOnce(successResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Individual KYC' }));
    const formData = {
      NIN: '12345678901',
      firstName: 'Ada',
      lastName: 'Okafor',
      dateOfBirth: new Date('1990-05-15T00:00:00.000Z'),
      gender: 'Female',
      emailAddress: 'ada@example.com',
    };

    await act(async () => { await result.current.handleSubmit(formData); });
    await act(async () => { await result.current.confirmSubmit(); });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/autofill/verify-nin');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/submit-form');
    expect(result.current.showSuccess).toBe(true);
  });

  it('verifies and matches CAC data before submitting Corporate KYC', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse({
        status: true,
        data: {
          name: 'Example Manufacturing Limited',
          registrationDate: '2020-01-15',
          address: '1 Marina Road Lagos',
        },
      }))
      .mockResolvedValueOnce(successResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Corporate KYC' }));
    const formData = {
      cacNumber: 'RC123456',
      insured: 'Example Manufacturing Limited',
      dateOfIncorporationRegistration: new Date('2020-01-15T00:00:00.000Z'),
      officeAddress: '1 Marina Road Lagos',
      emailAddress: 'company@example.com',
    };

    await act(async () => { await result.current.handleSubmit(formData); });
    await act(async () => { await result.current.confirmSubmit(); });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/autofill/verify-cac');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/submit-form');
    expect(result.current.showSuccess).toBe(true);
  });
});
