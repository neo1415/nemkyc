import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OfferCard from '../../components/claims/OfferCard';
import type { ClaimBlock, ClaimOffer } from '../../lib/claimLifecycle';

const api = vi.hoisted(() => ({
  acceptOffer: vi.fn(),
  queryOffer: vi.fn(),
  markDocumentProvided: vi.fn(),
}));

vi.mock('../../services/claimsApi', () => api);

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const offer = (overrides: Partial<ClaimOffer>): ClaimOffer => ({
  version: 1,
  amount: 1_500_000,
  currency: 'NGN',
  basis: 'Repair estimate less betterment',
  excess: 50_000,
  deductions: [{ label: 'Salvage', amount: 25_000 }],
  issuedAt: Date.UTC(2026, 8, 10),
  issuedByUid: 'staff-1',
  status: 'offered',
  dvUrl: null,
  queryReason: null,
  ...overrides,
});

const claim = (offers: ClaimOffer[]): ClaimBlock => ({
  stage: 'accept',
  step: 'offer_issued',
  waitingOn: 'customer',
  notifiedAt: Date.now(),
  targetDate: Date.now(),
  history: [],
  outstandingDocuments: [],
  offers,
  decision: null,
  payment: null,
});

describe('OfferCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the open offer in naira with basis, excess, deductions, version and discharge voucher link', () => {
    render(
      <OfferCard
        collection="motor-claims"
        id="claim-1"
        claim={claim([offer({ version: 1, status: 'superseded' }), offer({ version: 2, amount: 1_750_000, dvUrl: 'https://example.com/dv.pdf' })])}
      />,
    );

    expect(screen.getByTestId('offer-amount')).toHaveTextContent('₦1,750,000.00');
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Repair estimate less betterment')).toBeInTheDocument();
    expect(screen.getByText('₦50,000.00')).toBeInTheDocument();
    expect(screen.getByText('Salvage')).toBeInTheDocument();
    expect(screen.getByTestId('offer-dv-link')).toHaveAttribute('href', 'https://example.com/dv.pdf');
    expect(screen.getByText('Revised settlement offer')).toBeInTheDocument();

    // Previous offers are collapsed until toggled
    expect(screen.queryByTestId('previous-offer-1')).toBeNull();
    fireEvent.click(screen.getByTestId('previous-offers-toggle'));
    expect(screen.getByTestId('previous-offer-1')).toHaveTextContent('Superseded');
  });

  it('calls queryOffer with the reason and hands the returned claim to onUpdated', async () => {
    const updated = claim([offer({ version: 1, status: 'queried', queryReason: 'Estimate is higher' })]);
    updated.step = 'offer_queried';
    updated.waitingOn = 'nem';
    api.queryOffer.mockResolvedValue({ success: true, claim: updated, status: 'approved' });
    const onUpdated = vi.fn();

    render(<OfferCard collection="motor-claims" id="claim-1" claim={claim([offer({ version: 1 })])} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByTestId('offer-query'));
    const textarea = await screen.findByTestId('offer-query-reason');
    expect(screen.getByTestId('offer-query-submit')).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '  Estimate is higher  ' } });
    expect(screen.getByTestId('offer-query-submit')).toBeEnabled();
    fireEvent.click(screen.getByTestId('offer-query-submit'));

    await waitFor(() => expect(api.queryOffer).toHaveBeenCalledWith('motor-claims', 'claim-1', 1, 'Estimate is higher'));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(api.acceptOffer).not.toHaveBeenCalled();
  });

  it('asks for confirmation before calling acceptOffer with the open version', async () => {
    const updated = claim([offer({ version: 3, status: 'accepted' })]);
    updated.step = 'offer_accepted';
    api.acceptOffer.mockResolvedValue({ success: true, claim: updated, status: 'approved' });
    const onUpdated = vi.fn();

    render(<OfferCard collection="motor-claims" id="claim-1" claim={claim([offer({ version: 3 })])} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByTestId('offer-accept'));
    expect(api.acceptOffer).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByTestId('offer-accept-confirm'));
    await waitFor(() => expect(api.acceptOffer).toHaveBeenCalledWith('motor-claims', 'claim-1', 3));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
  });

  it('renders nothing when there are no offers at all', () => {
    const { container } = render(<OfferCard collection="motor-claims" id="claim-1" claim={claim([])} />);
    expect(container).toBeEmptyDOMElement();
  });
});
