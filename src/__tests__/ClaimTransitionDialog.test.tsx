import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClaimTransitionDialog from '../components/admin/ClaimTransitionDialog';
import { ClaimsApiError } from '../services/claimsApi';
import type { ClaimBlock } from '../lib/claimLifecycle';

const mocks = vi.hoisted(() => ({ transitionClaim: vi.fn() }));

vi.mock('../services/claimsApi', () => {
  class MockClaimsApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly details?: unknown;
    constructor(message: string, status: number, code?: string, details?: unknown) {
      super(message);
      this.name = 'ClaimsApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }
  return { transitionClaim: mocks.transitionClaim, ClaimsApiError: MockClaimsApiError };
});

const radioLabels = () =>
  screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).value);

const renderDialog = (doc: Record<string, unknown>, overrides: Partial<React.ComponentProps<typeof ClaimTransitionDialog>> = {}) => {
  const onUpdated = vi.fn();
  const onClose = vi.fn();
  render(
    <ClaimTransitionDialog
      open
      onClose={onClose}
      collection="motor-claims"
      id="claim-1"
      doc={doc}
      onUpdated={onUpdated}
      {...overrides}
    />,
  );
  return { onUpdated, onClose };
};

const assessedClaim = (): ClaimBlock => ({
  stage: 'review',
  step: 'assessed',
  waitingOn: 'nem',
  notifiedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  targetDate: Date.now() + 57 * 24 * 60 * 60 * 1000,
  history: [],
  outstandingDocuments: [],
  offers: [],
  decision: null,
  payment: null,
});

describe('ClaimTransitionDialog', () => {
  beforeEach(() => {
    mocks.transitionClaim.mockReset();
  });

  it('offers only the legal staff steps for a legacy pending document', () => {
    renderDialog({ status: 'pending', submittedAt: Date.now() });

    expect(radioLabels()).toEqual(['docs_requested', 'docs_complete', 'coverage_confirmed', 'declined']);
    expect(screen.queryByText('Offer queried')).not.toBeInTheDocument();
    expect(screen.queryByText('Offer accepted')).not.toBeInTheDocument();
  });

  it('hides customer-only transitions when an offer is open', () => {
    renderDialog({ claim: { ...assessedClaim(), step: 'offer_issued', stage: 'accept' } });

    expect(radioLabels()).toEqual(['offer_revised', 'declined']);
  });

  it('requires a decline reason before posting a decline', async () => {
    mocks.transitionClaim.mockResolvedValue({
      success: true,
      claim: { ...assessedClaim(), step: 'declined', stage: 'declined' },
      status: 'rejected',
    });
    const { onUpdated } = renderDialog({ status: 'pending' });

    fireEvent.click(screen.getByRole('radio', { name: /Claim declined/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Move claim' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A decline reason is required');
    expect(mocks.transitionClaim).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Decline reason/), { target: { value: 'Loss not covered by the policy' } });
    fireEvent.change(screen.getByLabelText(/^Note/), { target: { value: 'Reviewed with underwriting' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move claim' }));

    await waitFor(() => expect(mocks.transitionClaim).toHaveBeenCalledTimes(1));
    expect(mocks.transitionClaim).toHaveBeenCalledWith('motor-claims', 'claim-1', {
      step: 'declined',
      note: 'Reviewed with underwriting',
      reason: 'Loss not covered by the policy',
    });
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ step: 'declined' }), 'rejected'));
  });

  it('posts a settlement offer through transitionClaim and reports the result', async () => {
    const updatedClaim: ClaimBlock = {
      ...assessedClaim(),
      step: 'offer_issued',
      stage: 'accept',
      waitingOn: 'customer',
      offers: [{
        version: 1, amount: 250000, currency: 'NGN', basis: 'Repair estimate', excess: null, deductions: [],
        issuedAt: Date.now(), issuedByUid: 'staff-1', status: 'offered', dvUrl: null, queryReason: null,
      }],
    };
    mocks.transitionClaim.mockResolvedValue({ success: true, claim: updatedClaim, status: 'approved' });
    const { onUpdated, onClose } = renderDialog({ claim: assessedClaim() });

    expect(radioLabels()).toEqual(['offer_issued', 'declined']);
    fireEvent.click(screen.getByRole('radio', { name: /Settlement offer issued/ }));
    fireEvent.change(screen.getByLabelText(/Amount \(NGN\)/), { target: { value: '250000' } });
    fireEvent.change(screen.getByLabelText(/Basis of settlement/), { target: { value: 'Repair estimate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move claim' }));

    await waitFor(() => expect(mocks.transitionClaim).toHaveBeenCalledTimes(1));
    expect(mocks.transitionClaim).toHaveBeenCalledWith('motor-claims', 'claim-1', {
      step: 'offer_issued',
      note: '',
      offer: { amount: 250000, currency: 'NGN', basis: 'Repair estimate', excess: null, deductions: [], dvUrl: null },
    });
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedClaim, 'approved'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows server errors with details inline', async () => {
    mocks.transitionClaim.mockRejectedValue(
      new ClaimsApiError('Transition not allowed', 409, 'INVALID_TRANSITION', ['assessed -> closed is not permitted']),
    );
    const { onUpdated } = renderDialog({ claim: assessedClaim() });

    fireEvent.click(screen.getByRole('radio', { name: /Claim declined/ }));
    fireEvent.change(screen.getByLabelText(/Decline reason/), { target: { value: 'Fraud indicators' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move claim' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Transition not allowed');
    expect(alert).toHaveTextContent('assessed -> closed is not permitted');
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('is disabled for closed and declined claims', () => {
    renderDialog({ claim: { ...assessedClaim(), step: 'closed', stage: 'closed' } });

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByText(/This claim is closed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move claim' })).toBeDisabled();
  });
});
