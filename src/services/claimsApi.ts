import { API_BASE_URL } from '@/config/constants';
import { getCSRFToken } from '@/utils/csrfToken';
import { auth } from '@/firebase/config';
import type { ClaimBlock, ClaimStep, LegacyStatus, OutstandingDocument } from '@/lib/claimLifecycle';

/**
 * Backend contract for the claim lifecycle (apps/backend/src/routes/claims.cjs).
 * Every call is authenticated with the signed-in user's Firebase ID token.
 */

export interface TransitionInput {
  step: ClaimStep;
  note?: string;
  outstandingDocuments?: Pick<OutstandingDocument, 'label' | 'required'>[];
  offer?: { amount: number; currency?: string; basis?: string; excess?: number | null; deductions?: { label: string; amount: number }[]; dvUrl?: string | null };
  queryReason?: string;
  reason?: string;
  payment?: { reference: string; amount?: number | null; currency?: string; paidAt?: number };
}

export interface TransitionResponse {
  success: true;
  claim: ClaimBlock;
  status: LegacyStatus;
}

export class ClaimsApiError extends Error {
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

async function request<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ClaimsApiError('Please sign in again.', 401, 'UNAUTHENTICATED');
  const [token, csrfToken] = await Promise.all([user.getIdToken(), getCSRFToken()]);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'CSRF-Token': csrfToken,
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClaimsApiError(data.message || data.error || 'The request failed. Please try again.', response.status, data.code, data.details);
  }
  return data as T;
}

const encode = (value: string) => encodeURIComponent(value);

/** Staff: move a claim to its next step. */
export function transitionClaim(collection: string, id: string, input: TransitionInput): Promise<TransitionResponse> {
  return request(`/api/claims/${encode(collection)}/${encode(id)}/transition`, input);
}

/** Customer: accept the open settlement offer. */
export function acceptOffer(collection: string, id: string, version: number): Promise<TransitionResponse> {
  return request(`/api/claims/${encode(collection)}/${encode(id)}/offer/${version}/accept`, {});
}

/** Customer: query the open settlement offer with a reason (a revised offer may follow). */
export function queryOffer(collection: string, id: string, version: number, reason: string): Promise<TransitionResponse> {
  return request(`/api/claims/${encode(collection)}/${encode(id)}/offer/${version}/query`, { reason });
}

/** Customer: report that an outstanding document has been uploaded (the file goes through the documents endpoint). */
export function markDocumentProvided(collection: string, id: string, key: string, url: string): Promise<TransitionResponse> {
  return request(`/api/claims/${encode(collection)}/${encode(id)}/documents/${encode(key)}`, { url });
}
