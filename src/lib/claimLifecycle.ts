/**
 * Claim lifecycle (browser mirror of apps/backend/src/lib/claimLifecycle.cjs).
 * Keep the tables identical to the backend; the backend is the authority for transitions.
 *
 * Customer-facing stages: REPORT -> SUBMIT -> REVIEW -> ACCEPT -> PAY, plus closed / declined.
 */

export type ClaimStage = 'report' | 'submit' | 'review' | 'accept' | 'pay' | 'closed' | 'declined';

export type ClaimStep =
  | 'registered'
  | 'docs_requested'
  | 'docs_complete'
  | 'coverage_confirmed'
  | 'assessed'
  | 'offer_issued'
  | 'offer_queried'
  | 'offer_revised'
  | 'offer_accepted'
  | 'discharged'
  | 'payment_processed'
  | 'payment_confirmed'
  | 'closed'
  | 'declined';

export type WaitingOn = 'customer' | 'nem' | 'none';
export type StepActor = 'system' | 'staff' | 'customer';

export interface ClaimHistoryEntry {
  step: ClaimStep;
  stage: ClaimStage;
  at: number;
  byUid: string | null;
  byName: string;
  note: string;
  customerVisible: boolean;
}

export interface OutstandingDocument {
  key: string;
  label: string;
  required: boolean;
  receivedAt: number | null;
  url: string | null;
  requestedAt?: number;
}

export interface ClaimOffer {
  version: number;
  amount: number;
  currency: string;
  basis: string;
  excess: number | null;
  deductions: { label: string; amount: number }[];
  issuedAt: number;
  issuedByUid: string | null;
  status: 'offered' | 'queried' | 'accepted' | 'superseded';
  dvUrl: string | null;
  queryReason: string | null;
  queriedAt?: number;
  acceptedAt?: number;
}

export interface ClaimDecision {
  outcome: 'proceed' | 'decline';
  reason: string;
  at: number;
  byUid: string | null;
}

export interface ClaimPayment {
  reference: string;
  amount: number | null;
  currency: string;
  paidAt: number;
  confirmedAt: number | null;
}

export interface ClaimBlock {
  stage: ClaimStage;
  step: ClaimStep;
  waitingOn: WaitingOn;
  notifiedAt: number;
  targetDate: number;
  history: ClaimHistoryEntry[];
  outstandingDocuments: OutstandingDocument[];
  offers: ClaimOffer[];
  decision: ClaimDecision | null;
  payment: ClaimPayment | null;
  closedAt?: number;
}

export const STAGES: ClaimStage[] = ['report', 'submit', 'review', 'accept', 'pay', 'closed', 'declined'];

export const STAGE_LABELS: Record<ClaimStage, string> = {
  report: 'Report',
  submit: 'Submit',
  review: 'Review',
  accept: 'Accept',
  pay: 'Pay',
  closed: 'Closed',
  declined: 'Declined',
};

/** Customer-facing wording per stage, from the claims department's process table. */
export const STAGE_DESCRIPTIONS: Record<ClaimStage, { customer: string; nem: string }> = {
  report: { customer: 'Report the loss', nem: 'Claim registered, claim number issued' },
  submit: { customer: 'Submit required documents', nem: 'Complete claim file' },
  review: { customer: 'Confirm policy coverage', nem: 'Assess loss and quantum of claim' },
  accept: { customer: 'Receive settlement offer, accept or query', nem: 'Discharge completed' },
  pay: { customer: 'Payment processed', nem: 'Payment confirmed, claim closed' },
  closed: { customer: 'Claim closed', nem: 'Claim closed' },
  declined: { customer: 'Claim declined', nem: 'Claim declined' },
};

export const STEPS: Record<ClaimStep, { stage: ClaimStage; waitingOn: WaitingOn; actor: StepActor; label: string; customer: string }> = {
  registered:         { stage: 'report',  waitingOn: 'nem',      actor: 'system',   label: 'Claim registered',          customer: 'Your claim has been registered and a claim number issued.' },
  docs_requested:     { stage: 'submit',  waitingOn: 'customer', actor: 'staff',    label: 'Documents requested',       customer: 'We need some documents from you to complete your claim file.' },
  docs_complete:      { stage: 'submit',  waitingOn: 'nem',      actor: 'staff',    label: 'Claim file complete',       customer: 'All required documents have been received.' },
  coverage_confirmed: { stage: 'review',  waitingOn: 'nem',      actor: 'staff',    label: 'Policy coverage confirmed', customer: 'Your policy covers this loss. We are assessing the claim.' },
  assessed:           { stage: 'review',  waitingOn: 'nem',      actor: 'staff',    label: 'Loss and quantum assessed', customer: 'The loss has been assessed. A decision is being prepared.' },
  offer_issued:       { stage: 'accept',  waitingOn: 'customer', actor: 'staff',    label: 'Settlement offer issued',   customer: 'A settlement offer is ready for you to accept or query.' },
  offer_queried:      { stage: 'accept',  waitingOn: 'nem',      actor: 'customer', label: 'Offer queried',             customer: 'You queried the offer. We are reviewing your query.' },
  offer_revised:      { stage: 'accept',  waitingOn: 'customer', actor: 'staff',    label: 'Revised offer issued',      customer: 'A revised settlement offer is ready for you to accept or query.' },
  offer_accepted:     { stage: 'accept',  waitingOn: 'nem',      actor: 'customer', label: 'Offer accepted',            customer: 'You accepted the offer. We are preparing your discharge voucher.' },
  discharged:         { stage: 'accept',  waitingOn: 'nem',      actor: 'staff',    label: 'Discharge completed',       customer: 'Your discharge voucher has been executed. Payment is being processed.' },
  payment_processed:  { stage: 'pay',     waitingOn: 'nem',      actor: 'staff',    label: 'Payment processed',         customer: 'Payment has been processed to your account.' },
  payment_confirmed:  { stage: 'pay',     waitingOn: 'nem',      actor: 'staff',    label: 'Payment confirmed',         customer: 'Payment has been confirmed.' },
  closed:             { stage: 'closed',  waitingOn: 'none',     actor: 'staff',    label: 'Claim closed',              customer: 'Your claim is closed. Thank you.' },
  declined:           { stage: 'declined',waitingOn: 'none',     actor: 'staff',    label: 'Claim declined',            customer: 'We are unable to proceed with this claim. The reason is explained below.' },
};

export const TRANSITIONS: Record<ClaimStep, ClaimStep[]> = {
  registered:         ['docs_requested', 'docs_complete', 'coverage_confirmed', 'declined'],
  docs_requested:     ['docs_requested', 'docs_complete', 'declined'],
  docs_complete:      ['docs_requested', 'coverage_confirmed', 'declined'],
  coverage_confirmed: ['docs_requested', 'assessed', 'declined'],
  assessed:           ['offer_issued', 'declined'],
  offer_issued:       ['offer_accepted', 'offer_queried', 'offer_revised', 'declined'],
  offer_queried:      ['offer_revised', 'declined'],
  offer_revised:      ['offer_accepted', 'offer_queried', 'offer_revised', 'declined'],
  offer_accepted:     ['discharged'],
  discharged:         ['payment_processed'],
  payment_processed:  ['payment_confirmed'],
  payment_confirmed:  ['closed'],
  closed:             [],
  declined:           [],
};

export const STEP_REQUIREMENTS: Partial<Record<ClaimStep, string[]>> = {
  docs_requested: ['outstandingDocuments'],
  offer_issued: ['offer'],
  offer_revised: ['offer'],
  offer_queried: ['queryReason'],
  declined: ['reason'],
  payment_processed: ['payment'],
};

export const CUSTOMER_STAGES: ClaimStage[] = ['report', 'submit', 'review', 'accept', 'pay'];

export type LegacyStatus = 'pending' | 'processing' | 'approved' | 'rejected';

export function legacyStatusForStage(stage: ClaimStage): LegacyStatus {
  switch (stage) {
    case 'report':
    case 'submit':
      return 'pending';
    case 'review':
      return 'processing';
    case 'accept':
    case 'pay':
    case 'closed':
      return 'approved';
    case 'declined':
      return 'rejected';
    default:
      return 'pending';
  }
}

export function stepFromLegacyStatus(status: unknown): ClaimStep {
  switch (String(status || '').toLowerCase()) {
    case 'processing':
      return 'coverage_confirmed';
    case 'approved':
    case 'completed':
      return 'offer_issued';
    case 'rejected':
    case 'cancelled':
      return 'declined';
    default:
      return 'registered';
  }
}

export function isValidStep(step: unknown): step is ClaimStep {
  return typeof step === 'string' && Object.prototype.hasOwnProperty.call(STEPS, step);
}

export function canTransition(fromStep: ClaimStep | undefined, toStep: ClaimStep): boolean {
  const from = fromStep && isValidStep(fromStep) ? fromStep : 'registered';
  return TRANSITIONS[from].includes(toStep);
}

export function stageIndex(stage: ClaimStage): number {
  if (stage === 'closed') return CUSTOMER_STAGES.length;
  if (stage === 'declined') return -1;
  return CUSTOMER_STAGES.indexOf(stage);
}

/**
 * Reads the claim block from a submission document, synthesising one for claims that predate
 * the lifecycle from their legacy status so every claim renders on the same tracker.
 */
export function resolveClaimBlock(doc: { claim?: Partial<ClaimBlock> | null; status?: unknown; submittedAt?: unknown; timestamp?: unknown }): ClaimBlock {
  if (doc.claim && isValidStep(doc.claim.step)) {
    const step = doc.claim.step;
    return {
      stage: STEPS[step].stage,
      step,
      waitingOn: doc.claim.waitingOn || STEPS[step].waitingOn,
      notifiedAt: doc.claim.notifiedAt || 0,
      targetDate: doc.claim.targetDate || 0,
      history: doc.claim.history || [],
      outstandingDocuments: doc.claim.outstandingDocuments || [],
      offers: doc.claim.offers || [],
      decision: doc.claim.decision || null,
      payment: doc.claim.payment || null,
      closedAt: doc.claim.closedAt,
    };
  }
  const step = stepFromLegacyStatus(doc.status);
  const submitted = toMillis(doc.submittedAt) || toMillis(doc.timestamp) || 0;
  return {
    stage: STEPS[step].stage,
    step,
    waitingOn: STEPS[step].waitingOn,
    notifiedAt: submitted,
    targetDate: submitted ? submitted + 60 * 24 * 60 * 60 * 1000 : 0,
    history: [],
    outstandingDocuments: [],
    offers: [],
    decision: null,
    payment: null,
  };
}

export function openOffer(claim: ClaimBlock): ClaimOffer | null {
  const latest = claim.offers[claim.offers.length - 1];
  return latest && latest.status === 'offered' ? latest : null;
}

export function daysSinceNotification(claim: ClaimBlock, now = Date.now()): number | null {
  if (!claim.notifiedAt) return null;
  return Math.floor((now - claim.notifiedAt) / (24 * 60 * 60 * 1000));
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}
