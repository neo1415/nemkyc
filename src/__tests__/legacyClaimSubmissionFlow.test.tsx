import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthRequiredSubmit } from '../hooks/useAuthRequiredSubmit';

const testState = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string },
  navigate: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: testState.user }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => testState.navigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
    testState.navigate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each(LEGACY_CLAIMS)('retains %s and pauses a guest submission for sign-in', async formType => {
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
    expect(testState.navigate).toHaveBeenCalledWith('/auth/signin');
    expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!)).toMatchObject({
      formData: payload,
      formType,
      currentStep: 2,
      resumeState: 'ready',
    });
  });

  it('retains an authenticated claim for review when the backend fails', async () => {
    testState.user = { uid: 'user-123', email: 'customer@example.com' };
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
});
