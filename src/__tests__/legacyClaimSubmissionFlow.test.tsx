import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthRequiredSubmit } from '../hooks/useAuthRequiredSubmit';

const testState = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string },
  firebaseUser: null as null | { getIdToken: ReturnType<typeof vi.fn> },
  navigate: vi.fn(),
  requestGuestIdentity: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: testState.user, firebaseUser: testState.firebaseUser }),
}));

vi.mock('../contexts/GuestIdentityContext', () => ({
  useGuestIdentity: () => ({ requestGuestIdentity: testState.requestGuestIdentity }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => testState.navigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../utils/csrfToken', () => ({
  getCSRFToken: vi.fn().mockResolvedValue('csrf-token'),
}));

const LEGACY_CLAIMS = [
  'All Risk Claim',
  'Burglary Claim',
  'Combined GPA Employers Liability Claim',
  'Contractors Plant & Machinery Claim',
  'Employers Liability Claim',
  'Fidelity Guarantee Claim',
  'Fire Special Perils Claim',
  'Goods In Transit Claim',
  'Group Personal Accident Claim',
  'Money Insurance Claim',
  'Professional Indemnity Claim',
  'Public Liability Claim',
  'Rent Assurance Claim',
] as const;

describe('legacy claims account-bound submission flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    testState.user = null;
    testState.firebaseUser = null;
    testState.navigate.mockReset();
    testState.requestGuestIdentity.mockReset();
    testState.requestGuestIdentity.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each(LEGACY_CLAIMS)('asks a guest for their identity on %s and submits nothing when dismissed', async formType => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const payload = { policyNumber: 'POL-123', insured: 'Test Customer' };
    const { result } = renderHook(() => useAuthRequiredSubmit(2));

    let submitted = true;
    await act(async () => {
      submitted = await result.current.handleSubmitWithAuth(payload, formType);
    });

    expect(submitted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(testState.requestGuestIdentity).toHaveBeenCalledWith({ formLabel: formType });
    expect(testState.navigate).not.toHaveBeenCalledWith('/auth/signin');
  });

  it('submits a legacy claim as a guest with the captured identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ ticketId: 'MC-1' }) });
    vi.stubGlobal('fetch', fetchMock);
    testState.requestGuestIdentity.mockResolvedValue({
      kind: 'guest',
      identity: { name: 'Ada Obi', email: 'ada@example.com' },
    });
    const payload = { policyNumber: 'POL-123', insured: 'Test Customer' };
    const { result } = renderHook(() => useAuthRequiredSubmit(2));

    let submitted = false;
    await act(async () => {
      submitted = await result.current.handleSubmitWithAuth(payload, 'Motor Claim');
    });

    expect(submitted).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    const body = JSON.parse(init.body);
    expect(body.guest).toEqual({ name: 'Ada Obi', email: 'ada@example.com' });
    expect(body.formType).toBe('Motor Claim');
    expect(sessionStorage.getItem('pendingSubmission')).toBeNull();
  });

  it('keeps the claim pending when the guest signs in to an existing account instead', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      clone() { return this; },
      json: async () => ({ code: 'ACCOUNT_EXISTS' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    testState.requestGuestIdentity
      .mockResolvedValueOnce({ kind: 'guest', identity: { name: 'Ada Obi', email: 'ada@example.com' } })
      .mockResolvedValueOnce({ kind: 'signed-in', email: 'ada@example.com' });
    const payload = { policyNumber: 'POL-123', insured: 'Test Customer' };
    const { result } = renderHook(() => useAuthRequiredSubmit(2));

    let submitted = true;
    await act(async () => {
      submitted = await result.current.handleSubmitWithAuth(payload, 'Motor Claim');
    });

    expect(submitted).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!)).toMatchObject({
      formData: payload,
      formType: 'Motor Claim',
      currentStep: 2,
    });
  });

  it('retains an authenticated claim for review when the backend fails', async () => {
    testState.user = { uid: 'user-123', email: 'customer@example.com' };
    testState.firebaseUser = { getIdToken: vi.fn().mockResolvedValue('firebase-token') };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    const { result } = renderHook(() => useAuthRequiredSubmit());

    await expect(act(async () => {
      await result.current.handleSubmitWithAuth({ insured: 'Test Customer' }, 'Fire Special Perils Claim');
    })).rejects.toThrow('temporarily unavailable');

    expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!)).toMatchObject({
      formType: 'Fire Special Perils Claim',
      resumeState: 'needs-review',
    });
    expect(sessionStorage.getItem('pendingSubmissionKey')).toBeTruthy();
  });

  it.each(LEGACY_CLAIMS)('submits authenticated %s with a Firebase bearer token', async formType => {
    testState.user = { uid: 'user-123', email: 'customer@example.com' };
    testState.firebaseUser = { getIdToken: vi.fn().mockResolvedValue('firebase-token') };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, ticketId: 'CLM-123' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useAuthRequiredSubmit());

    await act(async () => {
      expect(await result.current.handleSubmitWithAuth({ policyNumber: 'POL-123' }, formType)).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer firebase-token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ formType });
    expect(sessionStorage.getItem('pendingSubmission')).toBeNull();
  });
});
