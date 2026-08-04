import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnhancedFormSubmit } from '../hooks/useEnhancedFormSubmit';

const testState = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; displayName: string },
  firebaseUser: null as null | { getIdToken: ReturnType<typeof vi.fn> },
  navigate: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: testState.user, firebaseUser: testState.firebaseUser }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => testState.navigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

const successResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

const ACCOUNT_BOUND_FORM_TYPES = [
  'Individual KYC',
  'Corporate KYC',
  'Individual NFIU',
  'Corporate NFIU',
  'Individual CDD',
  'Corporate CDD',
  'NAICOM Corporate CDD',
  'Partners CDD',
  'NAICOM Partners CDD',
  'Agents CDD',
  'Brokers CDD',
  'Motor Claim',
  'Farm Property and Produce Insurance Claim',
  'Fishery and Fish Farm Insurance Claim',
  'Livestock Insurance Claim',
  'Multi-Perils Crop Insurance Claim',
  'Poultry Claim',
  'Yield Index Insurance Claim',
  'Smart Artisan Protection Claim',
  'Smart Generation Z Protection Claim',
  'Smart Motorist Protection Claim',
  'Smart Students Protection Claim',
  'Smart Traveller Protection Claim',
  'NEM Home Protection Claim',
] as const;

const CDD_VERIFIED_DOCUMENT_FIELDS: Record<string, string[]> = {
  'Individual CDD': ['identification'],
  'Corporate CDD': ['cac', 'identification'],
  'NAICOM Corporate CDD': ['cac', 'identification', 'cacForm'],
  'Partners CDD': ['certificateOfIncorporation', 'directorId1', 'cacStatusReport'],
  'NAICOM Partners CDD': ['certificateOfIncorporation', 'directorId1', 'cacStatusReport', 'naicomLicenseCertificate'],
  'Agents CDD': ['agentId', 'naicomCertificate'],
  'Brokers CDD': ['Incorporation', 'identification'],
};

const verifiedDocumentState = (fields: readonly string[] = []) => Object.fromEntries(fields.flatMap(field => [
  [`${field}VerificationStatus`, 'verified'],
  [`${field}Verification`, { isMatch: true }],
]));

describe('account-bound customer submission flow', () => {
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

  it.each(ACCOUNT_BOUND_FORM_TYPES)(
    'pauses %s and redirects a guest to sign in without submitting',
    async formType => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const requiredDocuments = CDD_VERIFIED_DOCUMENT_FIELDS[formType];
      const submittedData = {
        emailAddress: 'customer@example.com',
        verified: true,
        ...verifiedDocumentState(requiredDocuments),
      };

      const { result } = renderHook(() => useEnhancedFormSubmit({
        formType,
        verificationData: { isVerified: true },
      }));

      await act(async () => { await result.current.handleSubmit(submittedData); });
      expect(result.current.showSummary).toBe(true);
      await act(async () => { await result.current.confirmSubmit(); });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.showSuccess).toBe(false);
      expect(testState.navigate).toHaveBeenCalledWith('/auth/signin');
      expect(JSON.parse(sessionStorage.getItem('pendingSubmission')!)).toMatchObject({
        formType,
        formData: submittedData,
      });
    },
  );

  it('automatically resumes a pending submission after authentication', async () => {
    sessionStorage.setItem('pendingSubmission', JSON.stringify({
      formType: 'Corporate CDD',
      formData: { companyName: 'Example Limited', emailAddress: 'form@example.com' },
      timestamp: Date.now(),
    }));
    testState.user = {
      uid: 'firebase-user-123',
      email: 'account@example.com',
      displayName: 'Account Owner',
    };
    testState.firebaseUser = { getIdToken: vi.fn().mockResolvedValue('fresh-firebase-token') };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse({ csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(successResponse({ success: true, ticketId: 'CDD-123' }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Corporate CDD' }));

    await waitFor(() => expect(result.current.showSuccess).toBe(true), { timeout: 5000 });
    expect(sessionStorage.getItem('pendingSubmission')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const submittedBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(submittedBody).toMatchObject({
      formType: 'Corporate CDD',
      userEmail: 'account@example.com',
      userUid: 'firebase-user-123',
    });
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh-firebase-token');
  });

  it('blocks an Individual CDD summary until its identity document is verified', async () => {
    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Individual CDD' }));

    await act(async () => {
      await result.current.handleSubmit({
        NINNumber: '12345678901',
        identification: { name: 'nin.pdf' },
      });
    });

    expect(result.current.showSummary).toBe(false);
    expect(result.current.showError).toBe(true);
    expect(result.current.errorMessage).toContain('successfully verify');
  });

  const CDD_VERIFICATION_CASES = [
    { formType: 'Individual CDD', documents: ['identification'], identityType: 'NIN', data: { NINNumber: '12345678901', firstName: 'Ada', lastName: 'Okafor', dateOfBirth: '1990-05-15', gender: 'Female' } },
    { formType: 'Agents CDD', documents: ['agentId', 'naicomCertificate'], identityType: 'NIN', data: { NINNumber: '12345678901', firstName: 'Ada', lastName: 'Okafor', dateOfBirth: '1990-05-15', gender: 'Female' } },
    { formType: 'Corporate CDD', documents: ['cac', 'identification'], identityType: 'CAC', data: { cacNumber: 'RC123456', companyName: 'Example Limited', dateOfIncorporationRegistration: '2020-01-15', registeredCompanyAddress: '1 Marina Road Lagos' } },
    { formType: 'NAICOM Corporate CDD', documents: ['cac', 'identification', 'cacForm'], identityType: 'CAC', data: { cacNumber: 'RC123456', companyName: 'Example Limited', dateOfIncorporationRegistration: '2020-01-15', registeredCompanyAddress: '1 Marina Road Lagos' } },
    { formType: 'Partners CDD', documents: ['certificateOfIncorporation', 'directorId1', 'cacStatusReport'], identityType: 'CAC', data: { incorporationNumber: 'RC123456', companyName: 'Example Limited', incorporationDate: '2020-01-15', registeredAddress: '1 Marina Road Lagos' } },
    { formType: 'NAICOM Partners CDD', documents: ['certificateOfIncorporation', 'directorId1', 'cacStatusReport', 'naicomLicenseCertificate'], identityType: 'CAC', data: { incorporationNumber: 'RC123456', companyName: 'Example Limited', incorporationDate: '2020-01-15', registeredAddress: '1 Marina Road Lagos' } },
    { formType: 'Brokers CDD', documents: ['Incorporation', 'identification'], identityType: 'CAC', data: { incorporationNumber: 'RC123456', companyName: 'Example Limited', dateOfIncorporationRegistration: '2020-01-15', companyAddress: '1 Marina Road Lagos' } },
  ] as const;

  it.each(CDD_VERIFICATION_CASES)(
    'verifies identity before submitting $formType',
    async ({ formType, documents, identityType, data }) => {
      testState.user = { uid: 'user-123', email: 'customer@example.com', displayName: 'Test Customer' };
      const verificationResponse = identityType === 'NIN'
        ? { status: true, data: { firstName: 'Ada', surname: 'Okafor', birthdate: '1990-05-15', gender: 'Female' } }
        : { status: true, data: { name: 'Example Limited', registrationDate: '2020-01-15', address: '1 Marina Road Lagos' } };
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(successResponse(verificationResponse))
        .mockResolvedValueOnce(successResponse({ csrfToken: 'csrf-token' }))
        .mockResolvedValueOnce(successResponse({ success: true, ticketId: 'CDD-123' }));
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useEnhancedFormSubmit({ formType }));
      await act(async () => {
        await result.current.handleSubmit({
          ...data,
          ...verifiedDocumentState(documents),
        });
      });
      expect(result.current.showSummary).toBe(true);

      await act(async () => { await result.current.confirmSubmit(); });

      expect(fetchMock.mock.calls[0][0]).toContain(identityType === 'NIN' ? '/api/autofill/verify-nin' : '/api/autofill/verify-cac');
      expect(fetchMock.mock.calls[2][0]).toContain('/api/submit-form');
      expect(result.current.showSuccess).toBe(true);
    },
  );

  it('verifies and matches NIN data before an authenticated Individual KYC submission', async () => {
    testState.user = {
      uid: 'firebase-user-123', email: 'ada@example.com', displayName: 'Ada Okafor'
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse({
        status: true,
        data: { firstName: 'Ada', surname: 'Okafor', birthdate: '1990-05-15', gender: 'Female' },
      }))
      .mockResolvedValueOnce(successResponse({ csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(successResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Individual KYC' }));
    await act(async () => { await result.current.handleSubmit({
      NIN: '12345678901', firstName: 'Ada', lastName: 'Okafor',
      dateOfBirth: new Date('1990-05-15T00:00:00.000Z'), gender: 'Female'
    }); });
    await act(async () => { await result.current.confirmSubmit(); });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/autofill/verify-nin');
    expect(fetchMock.mock.calls[2][0]).toContain('/api/submit-form');
    expect(result.current.showSuccess).toBe(true);
  });

  it('verifies and matches CAC data before an authenticated Corporate KYC submission', async () => {
    testState.user = {
      uid: 'firebase-user-123', email: 'company@example.com', displayName: 'Company Owner'
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse({
        status: true,
        data: {
          name: 'Example Manufacturing Limited',
          registrationDate: '2020-01-15',
          address: '1 Marina Road Lagos',
        },
      }))
      .mockResolvedValueOnce(successResponse({ csrfToken: 'csrf-token' }))
      .mockResolvedValueOnce(successResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Corporate KYC' }));
    await act(async () => { await result.current.handleSubmit({
      cacNumber: 'RC123456', insured: 'Example Manufacturing Limited',
      dateOfIncorporationRegistration: new Date('2020-01-15T00:00:00.000Z'),
      officeAddress: '1 Marina Road Lagos'
    }); });
    await act(async () => { await result.current.confirmSubmit(); });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/autofill/verify-cac');
    expect(fetchMock.mock.calls[2][0]).toContain('/api/submit-form');
    expect(result.current.showSuccess).toBe(true);
  });

  it('keeps the pending payload when resumed NIN verification needs customer review', async () => {
    sessionStorage.setItem('pendingSubmission', JSON.stringify({
      formType: 'Individual KYC',
      formData: {
        NIN: '12345678901', firstName: 'Daniel', lastName: 'Oyeniyi',
        identityDocument: 'https://storage.example/nin-document.jpg',
      },
      timestamp: Date.now(),
      resumeState: 'ready',
    }));
    testState.user = {
      uid: 'firebase-user-123', email: 'daniel@example.com', displayName: 'Daniel Oyeniyi'
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(successResponse({
      status: true,
      data: { firstName: 'Jane', lastName: 'Smith' },
    })));

    const { result } = renderHook(() => useEnhancedFormSubmit({ formType: 'Individual KYC' }));

    await waitFor(() => expect(result.current.showVerificationMismatch).toBe(true), { timeout: 5000 });
    const pending = JSON.parse(sessionStorage.getItem('pendingSubmission')!);
    expect(pending.resumeState).toBe('needs-review');
    expect(pending.formData.identityDocument).toBe('https://storage.example/nin-document.jpg');
  });
});
