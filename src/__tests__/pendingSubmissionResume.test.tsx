import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useEnhancedFormSubmit } from '../hooks/useEnhancedFormSubmit';
import { useAuthRequiredSubmit } from '../hooks/useAuthRequiredSubmit';

const testState = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; displayName?: string },
  firebaseUser: null as null | { getIdToken: ReturnType<typeof vi.fn> },
  navigate: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: testState.user, firebaseUser: testState.firebaseUser }),
}));

// A guest who signs in from the identity dialog takes the "persist and resume" path.
vi.mock('../contexts/GuestIdentityContext', () => ({
  useGuestIdentity: () => ({
    requestGuestIdentity: vi.fn().mockResolvedValue({ kind: 'signed-in', email: 'customer@example.com' }),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => testState.navigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../utils/csrfToken', () => ({
  getCSRFToken: vi.fn().mockResolvedValue('csrf-token'),
}));

const successResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

const authenticate = () => {
  testState.user = { uid: 'user-123', email: 'customer@example.com', displayName: 'Customer' };
  testState.firebaseUser = { getIdToken: vi.fn().mockResolvedValue('firebase-token') };
};

const pdf = (name: string) => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

describe('pending submission survives the sign-in detour without silently losing files', () => {
  beforeEach(() => {
    sessionStorage.clear();
    testState.user = null;
    testState.firebaseUser = null;
    testState.navigate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('useEnhancedFormSubmit', () => {
    it('strips File values before storing and records the field names', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Motor Claim' }));

      await act(async () => {
        await result.current.handleSubmit({
          policyNumber: 'POL-1',
          driversLicense: pdf('licence.pdf'),
          policeReport: pdf('report.pdf'),
        });
      });
      await act(async () => { await result.current.confirmSubmit(); });

      const stored = JSON.parse(sessionStorage.getItem('pendingSubmission')!);
      expect(stored.formData).toEqual({ policyNumber: 'POL-1', driversLicense: null, policeReport: null });
      expect(stored.pendingFileFields).toEqual(['driversLicense', 'policeReport']);
    });

    it('asks the customer to re-attach files instead of submitting without them', async () => {
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formType: 'Motor Claim',
        formData: { policyNumber: 'POL-1', driversLicense: null },
        pendingFileFields: ['driversLicense'],
        timestamp: Date.now(),
        resumeState: 'ready',
      }));
      authenticate();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Motor Claim' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please re-attach: Drivers license'));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.showSuccess).toBe(false);
      expect(result.current.formData).toEqual({ policyNumber: 'POL-1', driversLicense: null });
      expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!).resumeState).toBe('needs-review');
    });

    it('uses product labels for known CDD documents in the re-attach prompt', async () => {
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formType: 'Corporate CDD',
        formData: { companyName: 'Example Limited', cac: null },
        pendingFileFields: ['cac'],
        timestamp: Date.now(),
      }));
      authenticate();
      vi.stubGlobal('fetch', vi.fn());

      renderHook(() => useEnhancedFormSubmit({ formType: 'Corporate CDD' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please re-attach: CAC certificate'));
    });

    it('does not let stored nulls clobber re-attached files or corrected values on resubmit', async () => {
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formType: 'Motor Claim',
        formData: {
          policyNumber: 'POL-OLD',
          driversLicense: null,
          policeReportUrl: 'https://storage.example/report.pdf',
        },
        pendingFileFields: ['driversLicense'],
        timestamp: Date.now(),
        resumeState: 'needs-review',
      }));
      authenticate();
      const fetchMock = vi.fn().mockResolvedValue(successResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Motor Claim' }));
      const reattached = pdf('licence.pdf');

      await act(async () => {
        await result.current.handleSubmit({ policyNumber: 'POL-NEW', driversLicense: reattached });
      });
      await act(async () => { await result.current.confirmSubmit(); });

      expect(result.current.showSuccess).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/submit-form');
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.formData.policyNumber).toBe('POL-NEW');
      expect(body.formData.policeReportUrl).toBe('https://storage.example/report.pdf');
      // The re-attached File reached the submission payload rather than the stored null.
      expect(body.formData.driversLicense).not.toBeNull();
    });
  });

  describe('useAuthRequiredSubmit', () => {
    it('strips File values before storing and records the field names', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const { result } = renderHook(() => useAuthRequiredSubmit(1));

      await act(async () => {
        await result.current.handleSubmitWithAuth(
          { insured: 'Test Customer', carriageConditionDocument: pdf('carriage.pdf') },
          'Goods In Transit Claim',
        );
      });

      const stored = JSON.parse(sessionStorage.getItem('pendingSubmission')!);
      expect(stored.formData).toEqual({ insured: 'Test Customer', carriageConditionDocument: null });
      expect(stored.pendingFileFields).toEqual(['carriageConditionDocument']);
      expect(stored.currentStep).toBe(1);
    });

    it('asks the customer to re-attach files instead of submitting without them', async () => {
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formType: 'Goods In Transit Claim',
        formData: { insured: 'Test Customer', carriageConditionDocument: null },
        pendingFileFields: ['carriageConditionDocument'],
        timestamp: Date.now(),
        currentStep: 1,
        resumeState: 'ready',
      }));
      authenticate();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useAuthRequiredSubmit());

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please re-attach: Carriage condition document'));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.showSuccess).toBe(false);
      expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!).resumeState).toBe('needs-review');
      expect(result.current.getSavedStep()).toBe(1);
    });

    it('still resumes automatically when nothing needs re-attaching', async () => {
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formType: 'Fire Special Perils Claim',
        formData: { insured: 'Test Customer', evidenceUrl: 'https://storage.example/evidence.pdf' },
        pendingFileFields: [],
        timestamp: Date.now(),
      }));
      authenticate();
      const fetchMock = vi.fn().mockResolvedValue(successResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useAuthRequiredSubmit());

      await waitFor(() => expect(result.current.showSuccess).toBe(true));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem('pendingSubmission')).toBeNull();
    });
  });
});
