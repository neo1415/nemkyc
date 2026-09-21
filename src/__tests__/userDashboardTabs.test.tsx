import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SubmissionCard as SubmissionCardType } from '../services/userSubmissionsService';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const submissions: SubmissionCardType[] = [
  // Active claim (legacy status only) - newest
  { id: 'm1', ticketId: 'MC-001', formType: 'Motor Claim', submittedAt: new Date(now - 1 * DAY), status: 'processing', collection: 'motor-claims' },
  // Active claim with a lifecycle block at offer_issued
  {
    id: 'f1', ticketId: 'FC-001', formType: 'Fire Special Perils Claim', submittedAt: new Date(now - 5 * DAY), status: 'approved', collection: 'fire-special-perils-claims',
    claim: { step: 'offer_issued', stage: 'accept', waitingOn: 'customer', notifiedAt: now - DAY, history: [], outstandingDocuments: [], offers: [], decision: null, payment: null },
  },
  // Closed claim - excluded from the header
  {
    id: 'b1', ticketId: 'BC-001', formType: 'Burglary Claim', submittedAt: new Date(now - 20 * DAY), status: 'approved', collection: 'burglary-claims',
    claim: { step: 'closed', stage: 'closed', waitingOn: 'none', notifiedAt: now - 20 * DAY, history: [], outstandingDocuments: [], offers: [], decision: null, payment: null },
  },
  // Declined legacy claim - excluded from the header
  { id: 'a1', ticketId: 'AR-001', formType: 'All Risk Claim', submittedAt: new Date(now - 30 * DAY), status: 'rejected', collection: 'all-risk-claims' },
  // Compliance forms
  { id: 'k1', ticketId: 'KYC-001', formType: 'Individual KYC', submittedAt: new Date(now - 2 * DAY), status: 'approved', collection: 'Individual-kyc-form' },
  { id: 'c1', ticketId: 'CDD-001', formType: 'Agents CDD', submittedAt: new Date(now - 3 * DAY), status: 'pending', collection: 'agentsCDD' },
  { id: 'c2', ticketId: 'CDD-002', formType: 'Corporate CDD', submittedAt: new Date(now - 4 * DAY), status: 'processing', collection: 'corporate-kyc' },
  { id: 'n1', ticketId: 'NFIU-001', formType: 'Individual NFIU', submittedAt: new Date(now - 6 * DAY), status: 'processing', collection: 'individual-nfiu-form' },
];

vi.mock('../services/userSubmissionsService', () => ({
  getUserSubmissions: vi.fn(async () => submissions),
  subscribeToUserSubmissions: vi.fn((_email: string, callback: (items: SubmissionCardType[]) => void) => {
    callback(submissions);
    return () => {};
  }),
}));

vi.mock('firebase/auth', () => ({
  updatePassword: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn().mockResolvedValue(undefined),
  browserSessionPersistence: {},
}));

vi.mock('../firebase/config', () => ({ db: {}, auth: {} }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'customer', createdAt: new Date() },
    firebaseUser: null,
  }),
}));

vi.mock('../pages/admin/IdentityListsDashboard', () => ({ default: () => null }));

import UserDashboard from '../pages/dashboard/UserDashboard';

const renderDashboard = () => render(
  <MemoryRouter>
    <UserDashboard />
  </MemoryRouter>,
);

const cardsIn = (family: string) => within(screen.getByTestId(`family-list-${family}`)).getAllByTestId('submission-card');

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('summarises claims in the header without repeating the list below', async () => {
    renderDashboard();
    await screen.findByTestId('family-tab-claims');

    // The header is a summary only: total claims, and how many are waiting on the customer.
    const count = screen.getByTestId('claims-count');
    expect(count).toHaveTextContent('4');
    expect(count).toHaveTextContent('1 needs you');

    // The old per-claim cards in the header are gone; the Claims tab is the single list.
    expect(screen.queryByTestId('active-claims')).toBeNull();
    expect(screen.queryAllByTestId('active-claim-card')).toHaveLength(0);

    // The old analytics tiles are gone
    expect(screen.queryByText(/Total Submissions/i)).toBeNull();
  });

  it('groups submissions into Claims, KYC, CDD and NFIU tabs', async () => {
    renderDashboard();
    await screen.findByTestId('family-tab-claims');

    // Claims tab is the default and lists every claim, including closed and declined ones
    const claimCards = cardsIn('claims');
    expect(claimCards).toHaveLength(4);
    expect(claimCards.map(card => card.getAttribute('data-kind'))).toEqual(['claim', 'claim', 'claim', 'claim']);
    expect(screen.getByTestId('family-list-claims')).toHaveTextContent('Burglary Claim');
    expect(screen.getByTestId('family-list-claims')).toHaveTextContent('All Risk Claim');

    fireEvent.mouseDown(screen.getByTestId('family-tab-kyc'), { button: 0 });
    const kycCards = cardsIn('kyc');
    expect(kycCards).toHaveLength(1);
    expect(kycCards[0]).toHaveTextContent('Individual KYC');
    expect(kycCards[0]).toHaveTextContent('Approved');

    fireEvent.mouseDown(screen.getByTestId('family-tab-cdd'), { button: 0 });
    const cddCards = cardsIn('cdd');
    expect(cddCards).toHaveLength(2);
    expect(screen.getByTestId('family-list-cdd')).toHaveTextContent('Agents CDD');
    expect(screen.getByTestId('family-list-cdd')).toHaveTextContent('Corporate CDD');

    fireEvent.mouseDown(screen.getByTestId('family-tab-nfiu'), { button: 0 });
    const nfiuCards = cardsIn('nfiu');
    expect(nfiuCards).toHaveLength(1);
    expect(nfiuCards[0]).toHaveTextContent('Individual NFIU');
    expect(nfiuCards[0]).toHaveTextContent('Processing');
  });

  it('keeps the profile tab', async () => {
    renderDashboard();
    await screen.findByTestId('family-tab-claims');
    expect(screen.getByRole('tab', { name: /Profile & Settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Identity Collection/i })).toBeNull();
    expect(screen.getByText('Welcome, Ada Lovelace!')).toBeInTheDocument();
  });
});
