import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClaimProgress from '../../components/claims/ClaimProgress';
import { STEPS, type ClaimBlock } from '../../lib/claimLifecycle';

const DAY = 24 * 60 * 60 * 1000;

const claimBlock = (overrides: Partial<ClaimBlock>): Partial<ClaimBlock> => ({
  stage: 'accept',
  step: 'offer_issued',
  waitingOn: 'customer',
  notifiedAt: Date.now() - 3 * DAY,
  targetDate: Date.now() + 30 * DAY,
  history: [],
  outstandingDocuments: [],
  offers: [],
  decision: null,
  payment: null,
  ...overrides,
});

describe('ClaimProgress', () => {
  it('renders a legacy "processing" claim at the Review stage, with NEM', () => {
    render(
      <ClaimProgress
        doc={{ status: 'processing', submittedAt: new Date(Date.now() - 10 * DAY), ticketId: 'MC-20260901-0001' }}
      />,
    );

    expect(screen.getByTestId('claim-progress')).toHaveAttribute('data-stage', 'review');
    expect(screen.getByTestId('claim-progress')).toHaveAttribute('data-step', 'coverage_confirmed');
    expect(screen.getByTestId('claim-stage-report')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByTestId('claim-stage-submit')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByTestId('claim-stage-review')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('claim-stage-accept')).toHaveAttribute('data-state', 'upcoming');
    expect(screen.getByTestId('claim-stage-pay')).toHaveAttribute('data-state', 'upcoming');

    expect(screen.getByTestId('claim-waiting-chip')).toHaveTextContent('With NEM');
    expect(screen.getByTestId('claim-step-text')).toHaveTextContent(STEPS.coverage_confirmed.customer);
    expect(screen.getByTestId('claim-number')).toHaveTextContent('MC-20260901-0001');
    expect(screen.getByTestId('claim-days')).toHaveTextContent('Notified 10 days ago');
  });

  it('renders a claim block at offer_issued on the Accept stage, waiting on the customer', () => {
    render(<ClaimProgress doc={{ claim: claimBlock({ step: 'offer_issued' }), status: 'approved', ticketId: 'FC-1' }} compact />);

    const root = screen.getByTestId('claim-progress');
    expect(root).toHaveAttribute('data-stage', 'accept');
    expect(root).toHaveAttribute('data-compact', 'true');
    expect(screen.getByTestId('claim-stage-review')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByTestId('claim-stage-accept')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('claim-stage-pay')).toHaveAttribute('data-state', 'upcoming');
    expect(screen.getByTestId('claim-waiting-chip')).toHaveTextContent('Waiting on you');
    expect(screen.getByTestId('claim-step-text')).toHaveTextContent(STEPS.offer_issued.customer);
    expect(screen.getByTestId('claim-days')).toHaveTextContent('Notified 3 days ago');
  });

  it('renders a declined claim distinctly with the decision reason', () => {
    render(
      <ClaimProgress
        doc={{
          claim: claimBlock({
            step: 'declined',
            stage: 'declined',
            waitingOn: 'none',
            decision: { outcome: 'decline', reason: 'Policy had lapsed before the loss.', at: Date.now(), byUid: 'staff' },
            history: [
              { step: 'registered', stage: 'report', at: 1, byUid: null, byName: 'System', note: '', customerVisible: true },
              { step: 'docs_complete', stage: 'submit', at: 2, byUid: null, byName: 'Staff', note: '', customerVisible: true },
            ],
          }),
        }}
      />,
    );

    expect(screen.getByTestId('claim-declined')).toHaveTextContent('Claim declined');
    expect(screen.getByTestId('claim-declined')).toHaveTextContent('Policy had lapsed before the loss.');
    expect(screen.getByTestId('claim-declined').className).toContain('border-red-300');
    expect(screen.getByTestId('claim-stage-submit')).toHaveAttribute('data-state', 'declined');
    expect(screen.getByTestId('claim-stage-review')).toHaveAttribute('data-state', 'upcoming');
    expect(screen.getByTestId('claim-waiting-chip')).toHaveTextContent('Declined');
    expect(screen.queryByTestId('claim-step-text')).toBeNull();
  });

  it('renders a closed claim with every stage complete', () => {
    render(<ClaimProgress doc={{ claim: claimBlock({ step: 'closed', stage: 'closed', waitingOn: 'none' }) }} />);

    for (const stage of ['report', 'submit', 'review', 'accept', 'pay']) {
      expect(screen.getByTestId(`claim-stage-${stage}`)).toHaveAttribute('data-state', 'complete');
    }
    expect(screen.getByTestId('claim-waiting-chip')).toHaveTextContent('Closed');
  });

  it('falls back to Report / registered when a doc has neither claim block nor status', () => {
    render(<ClaimProgress doc={{}} />);
    expect(screen.getByTestId('claim-progress')).toHaveAttribute('data-stage', 'report');
    expect(screen.getByTestId('claim-stage-report')).toHaveAttribute('data-state', 'current');
    expect(screen.queryByTestId('claim-days')).toBeNull();
  });
});
