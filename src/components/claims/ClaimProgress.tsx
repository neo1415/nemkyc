import React from 'react';
import { Check, X, Hash, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CUSTOMER_STAGES,
  STAGE_LABELS,
  STEPS,
  daysSinceNotification,
  resolveClaimBlock,
  stageIndex,
  type ClaimBlock,
  type ClaimStage,
  type WaitingOn,
} from '@/lib/claimLifecycle';

export interface ClaimProgressDoc {
  claim?: Partial<ClaimBlock> | null;
  status?: unknown;
  submittedAt?: unknown;
  timestamp?: unknown;
  ticketId?: string | null;
}

interface ClaimProgressProps {
  doc: ClaimProgressDoc;
  /** Tighter layout for use inside submission cards. */
  compact?: boolean;
  className?: string;
}

type NodeState = 'complete' | 'current' | 'upcoming' | 'declined';

const WAITING_CHIP: Record<WaitingOn, { label: string; className: string } | null> = {
  customer: { label: 'Waiting on you', className: 'bg-amber-100 text-amber-900 border-amber-300' },
  nem: { label: 'With NEM', className: 'bg-blue-100 text-blue-900 border-blue-300' },
  none: null,
};

/** Furthest customer stage a declined claim reached, read from its visible history. */
const reachedStageIndex = (claim: ClaimBlock): number => {
  let reached = 0;
  for (const entry of claim.history || []) {
    const idx = stageIndex(entry.stage);
    if (idx > reached && idx < CUSTOMER_STAGES.length) reached = idx;
  }
  return reached;
};

const nodeStateFor = (stage: ClaimStage, position: number, claim: ClaimBlock): NodeState => {
  if (claim.stage === 'declined') {
    return position <= reachedStageIndex(claim) ? 'declined' : 'upcoming';
  }
  const current = stageIndex(claim.stage);
  if (position < current) return 'complete';
  if (position === current) return 'current';
  return 'upcoming';
};

const formatDays = (days: number | null): string | null => {
  if (days === null) return null;
  if (days <= 0) return 'Notified today';
  if (days === 1) return 'Notified 1 day ago';
  return `Notified ${days} days ago`;
};

const ClaimProgress: React.FC<ClaimProgressProps> = ({ doc, compact = false, className }) => {
  const claim = resolveClaimBlock(doc);
  const declined = claim.stage === 'declined';
  const closed = claim.stage === 'closed';
  const step = STEPS[claim.step];
  const chip = declined
    ? { label: 'Declined', className: 'bg-red-100 text-red-900 border-red-300' }
    : closed
      ? { label: 'Closed', className: 'bg-green-100 text-green-900 border-green-300' }
      : WAITING_CHIP[claim.waitingOn];
  const days = formatDays(daysSinceNotification(claim));

  const nodeSize = compact ? 'h-5 w-5 text-[10px]' : 'h-8 w-8 text-xs';
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div
      className={cn('w-full', className)}
      data-testid="claim-progress"
      data-stage={claim.stage}
      data-step={claim.step}
      data-compact={compact ? 'true' : 'false'}
    >
      <ol className={cn('flex items-start w-full', compact ? 'gap-0' : 'gap-0')} aria-label="Claim progress">
        {CUSTOMER_STAGES.map((stage, position) => {
          const state = nodeStateFor(stage, position, claim);
          const isLast = position === CUSTOMER_STAGES.length - 1;
          const connectorDone = state === 'complete' || (state === 'declined' && position < reachedStageIndex(claim));
          return (
            <li
              key={stage}
              className="flex-1 flex flex-col items-center min-w-0"
              data-testid={`claim-stage-${stage}`}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <div className="flex items-center w-full">
                <div className={cn('flex-1', position === 0 ? 'invisible' : '', compact ? 'h-0.5' : 'h-1',
                  state === 'complete' || state === 'current' ? 'bg-[#800020]' : state === 'declined' ? 'bg-red-300' : 'bg-gray-200')} />
                <div
                  className={cn(
                    'rounded-full border-2 flex items-center justify-center font-semibold shrink-0 transition-colors',
                    nodeSize,
                    state === 'complete' && 'bg-[#800020] border-[#800020] text-white',
                    state === 'current' && 'bg-white border-[#800020] text-[#800020] ring-4 ring-[#800020]/15',
                    state === 'upcoming' && 'bg-white border-gray-300 text-gray-400',
                    state === 'declined' && 'bg-red-50 border-red-400 text-red-600',
                  )}
                >
                  {state === 'complete' ? (
                    <Check className={iconSize} aria-hidden="true" />
                  ) : state === 'declined' ? (
                    <X className={iconSize} aria-hidden="true" />
                  ) : (
                    <span>{position + 1}</span>
                  )}
                </div>
                <div className={cn('flex-1', isLast ? 'invisible' : '', compact ? 'h-0.5' : 'h-1',
                  connectorDone ? 'bg-[#800020]' : state === 'declined' ? 'bg-red-300' : 'bg-gray-200')} />
              </div>
              <span
                className={cn(
                  'mt-1 uppercase tracking-wide text-center truncate w-full',
                  compact ? 'text-[10px]' : 'text-xs font-medium',
                  state === 'current' && 'text-[#800020] font-semibold',
                  state === 'complete' && 'text-gray-700',
                  state === 'upcoming' && 'text-gray-400',
                  state === 'declined' && 'text-red-600',
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>

      {declined && (
        <div
          className={cn('mt-3 rounded-md border border-red-300 bg-red-50 text-red-900', compact ? 'p-2 text-xs' : 'p-3 text-sm')}
          role="status"
          data-testid="claim-declined"
        >
          <p className="font-semibold">Claim declined</p>
          <p className={cn('mt-0.5', compact && 'line-clamp-2')}>
            {claim.decision?.reason?.trim() || 'No reason was recorded for this decision.'}
          </p>
        </div>
      )}

      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', compact ? 'mt-2' : 'mt-4')}>
        {chip && (
          <Badge className={cn('border', chip.className, compact && 'text-[10px] px-2 py-0')} data-testid="claim-waiting-chip">
            {chip.label}
          </Badge>
        )}
        {doc.ticketId && (
          <span className={cn('inline-flex items-center gap-1 text-gray-700', compact ? 'text-xs' : 'text-sm')} data-testid="claim-number">
            <Hash className={cn(iconSize, 'text-[#DAA520]')} aria-hidden="true" />
            <span className="font-mono">{doc.ticketId}</span>
          </span>
        )}
        {days && (
          <span className={cn('inline-flex items-center gap-1 text-gray-500', compact ? 'text-xs' : 'text-sm')} data-testid="claim-days">
            <Clock className={iconSize} aria-hidden="true" />
            {days}
          </span>
        )}
      </div>

      {!declined && (
        <p className={cn('text-gray-700', compact ? 'mt-1 text-xs line-clamp-2' : 'mt-2 text-sm')} data-testid="claim-step-text">
          {step.customer}
        </p>
      )}
    </div>
  );
};

export default ClaimProgress;
