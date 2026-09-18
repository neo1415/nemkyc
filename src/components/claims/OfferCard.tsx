import React, { useState } from 'react';
import { BadgeCheck, ChevronDown, FileText, Loader2, MessageSquareWarning } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { openOffer, type ClaimBlock, type ClaimOffer } from '@/lib/claimLifecycle';
import { acceptOffer, queryOffer } from '@/services/claimsApi';
import { formatDate } from '@/utils/dateFormatter';

interface OfferCardProps {
  collection: string;
  id: string;
  claim: ClaimBlock;
  /** Receives the updated claim block returned by the backend after accept / query. */
  onUpdated?: (claim: ClaimBlock) => void;
  className?: string;
}

const formatters = new Map<string, Intl.NumberFormat>();
const formatNaira = (amount: number | null | undefined, currency = 'NGN'): string => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  const code = currency || 'NGN';
  let formatter = formatters.get(code);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: code, maximumFractionDigits: 2 });
    } catch {
      formatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 });
    }
    formatters.set(code, formatter);
  }
  return formatter.format(Number(amount));
};

const OFFER_STATUS_BADGE: Record<ClaimOffer['status'], { label: string; className: string }> = {
  offered: { label: 'Open', className: 'bg-amber-100 text-amber-900 border-amber-300' },
  queried: { label: 'Queried', className: 'bg-blue-100 text-blue-900 border-blue-300' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-900 border-green-300' },
  superseded: { label: 'Superseded', className: 'bg-gray-100 text-gray-700 border-gray-300' },
};

const OfferDetails: React.FC<{ offer: ClaimOffer; muted?: boolean }> = ({ offer, muted }) => (
  <dl className={cn('grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm', muted && 'text-gray-600')}>
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">Settlement amount</dt>
      <dd className={cn('font-semibold', muted ? 'text-gray-700' : 'text-2xl text-[#800020]')} data-testid="offer-amount">
        {formatNaira(offer.amount, offer.currency)}
      </dd>
    </div>
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">Offer version</dt>
      <dd className="font-medium">v{offer.version}</dd>
    </div>
    {offer.basis && (
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-gray-500">Basis of settlement</dt>
        <dd className="whitespace-pre-wrap break-words">{offer.basis}</dd>
      </div>
    )}
    {offer.excess !== null && offer.excess !== undefined && (
      <div>
        <dt className="text-xs uppercase tracking-wide text-gray-500">Excess</dt>
        <dd className="font-medium">{formatNaira(offer.excess, offer.currency)}</dd>
      </div>
    )}
    {offer.deductions && offer.deductions.length > 0 && (
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-gray-500">Deductions</dt>
        <dd>
          <ul className="mt-1 divide-y divide-gray-100 rounded-md border border-gray-200">
            {offer.deductions.map((deduction, index) => (
              <li key={`${deduction.label}-${index}`} className="flex justify-between gap-3 px-3 py-1.5">
                <span>{deduction.label}</span>
                <span className="font-medium">{formatNaira(deduction.amount, offer.currency)}</span>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    )}
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">Issued</dt>
      <dd>{offer.issuedAt ? formatDate(offer.issuedAt, { includeTime: true }) : '—'}</dd>
    </div>
    {offer.dvUrl && (
      <div>
        <dt className="text-xs uppercase tracking-wide text-gray-500">Discharge voucher</dt>
        <dd>
          <a
            href={offer.dvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#800020] hover:underline font-medium"
            data-testid="offer-dv-link"
          >
            <FileText className="h-4 w-4" aria-hidden="true" /> View discharge voucher
          </a>
        </dd>
      </div>
    )}
    {offer.queryReason && (
      <div className="sm:col-span-2">
        <dt className="text-xs uppercase tracking-wide text-gray-500">Your query</dt>
        <dd className="whitespace-pre-wrap break-words">{offer.queryReason}</dd>
      </div>
    )}
  </dl>
);

const OfferCard: React.FC<OfferCardProps> = ({ collection, id, claim, onUpdated, className }) => {
  const offer = openOffer(claim);
  const previous = (claim.offers || []).filter(item => item !== offer);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'accept' | 'query' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!offer && previous.length === 0) return null;

  const handleAccept = async () => {
    if (!offer) return;
    setBusy('accept');
    try {
      const response = await acceptOffer(collection, id, offer.version);
      onUpdated?.(response.claim);
      setAcceptOpen(false);
      toast.success('Offer accepted', { description: 'We are preparing your discharge voucher.' });
    } catch (error) {
      console.error('Accept offer failed:', error);
      toast.error('Could not accept the offer', { description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  const handleQuery = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!offer) return;
    const trimmed = reason.trim();
    if (!trimmed) return;
    setBusy('query');
    try {
      const response = await queryOffer(collection, id, offer.version, trimmed);
      onUpdated?.(response.claim);
      setQueryOpen(false);
      setReason('');
      toast.success('Query sent', { description: 'Our claims team will review your query and respond.' });
    } catch (error) {
      console.error('Query offer failed:', error);
      toast.error('Could not send your query', { description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className={cn('shadow-sm', offer && 'border-2 border-[#DAA520]', className)} data-testid="offer-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold text-[#800020] flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              {offer ? (offer.version > 1 ? 'Revised settlement offer' : 'Settlement offer') : 'Settlement offers'}
            </CardTitle>
            <CardDescription>
              {offer
                ? 'Review the offer below. You can accept it or query it with your reason.'
                : 'No offer is currently open for your response.'}
            </CardDescription>
          </div>
          {offer && <Badge className={cn('border', OFFER_STATUS_BADGE.offered.className)}>Awaiting your response</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {offer && (
          <>
            <OfferDetails offer={offer} />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                className="bg-[#800020] hover:bg-[#600018] text-white"
                onClick={() => setAcceptOpen(true)}
                disabled={busy !== null}
                data-testid="offer-accept"
              >
                Accept offer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#800020] text-[#800020] hover:bg-[#800020]/5"
                onClick={() => setQueryOpen(true)}
                disabled={busy !== null}
                data-testid="offer-query"
              >
                <MessageSquareWarning className="h-4 w-4 mr-1" aria-hidden="true" /> Query offer
              </Button>
            </div>
          </>
        )}

        {previous.length > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                data-testid="previous-offers-toggle"
              >
                Previous offers ({previous.length})
                <ChevronDown className={cn('h-4 w-4 transition-transform', historyOpen && 'rotate-180')} aria-hidden="true" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {previous
                .slice()
                .sort((a, b) => b.version - a.version)
                .map(item => {
                  const badge = OFFER_STATUS_BADGE[item.status] || OFFER_STATUS_BADGE.superseded;
                  return (
                    <div key={item.version} className="rounded-md border border-gray-200 bg-gray-50 p-3" data-testid={`previous-offer-${item.version}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-800">Offer v{item.version}</p>
                        <Badge className={cn('border', badge.className)}>{badge.label}</Badge>
                      </div>
                      <OfferDetails offer={item} muted />
                    </div>
                  );
                })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      <AlertDialog open={acceptOpen} onOpenChange={open => !busy && setAcceptOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this settlement offer?</AlertDialogTitle>
            <AlertDialogDescription>
              {offer && (
                <>
                  You are accepting <span className="font-semibold text-gray-900">{formatNaira(offer.amount, offer.currency)}</span> in full and
                  final settlement of this claim. NEM will prepare your discharge voucher next.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'accept'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#800020] hover:bg-[#600018]"
              onClick={event => {
                event.preventDefault();
                void handleAccept();
              }}
              disabled={busy === 'accept'}
              data-testid="offer-accept-confirm"
            >
              {busy === 'accept' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" /> Accepting
                </>
              ) : (
                'Yes, accept offer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={queryOpen} onOpenChange={open => !busy && setQueryOpen(open)}>
        <DialogContent>
          <form onSubmit={handleQuery} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Query this offer</DialogTitle>
              <DialogDescription>
                Tell us why you disagree with the offer. Our claims team will review your query and may issue a revised offer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="offer-query-reason">Reason for your query</Label>
              <Textarea
                id="offer-query-reason"
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="For example: the repair estimate from my garage is higher than the amount offered."
                rows={5}
                required
                minLength={3}
                data-testid="offer-query-reason"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQueryOpen(false)} disabled={busy === 'query'}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#800020] hover:bg-[#600018] text-white"
                disabled={busy === 'query' || reason.trim().length === 0}
                data-testid="offer-query-submit"
              >
                {busy === 'query' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" /> Sending
                  </>
                ) : (
                  'Send query'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OfferCard;
