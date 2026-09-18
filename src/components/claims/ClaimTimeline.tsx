import React from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { STEPS, type ClaimBlock, type ClaimHistoryEntry } from '@/lib/claimLifecycle';
import { formatDate } from '@/utils/dateFormatter';

interface ClaimTimelineProps {
  claim: ClaimBlock;
  className?: string;
}

const entryLabel = (entry: ClaimHistoryEntry): string => STEPS[entry.step]?.label || entry.step;

const ClaimTimeline: React.FC<ClaimTimelineProps> = ({ claim, className }) => {
  const entries = (claim.history || [])
    .filter(entry => entry.customerVisible)
    .slice()
    .sort((a, b) => (a.at || 0) - (b.at || 0));

  return (
    <Card className={cn('shadow-sm', className)} data-testid="claim-timeline">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#800020] flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          Claim history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">No updates have been recorded yet.</p>
        ) : (
          <ol className="relative border-l-2 border-gray-200 ml-2 space-y-5">
            {entries.map((entry, index) => {
              const isLatest = index === entries.length - 1;
              return (
                <li key={`${entry.step}-${entry.at}-${index}`} className="ml-5 relative" data-testid="claim-timeline-entry">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white',
                      isLatest ? 'border-[#800020] bg-[#800020]' : 'border-gray-300',
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className={cn('text-sm font-medium', isLatest ? 'text-[#800020]' : 'text-gray-900')}>{entryLabel(entry)}</p>
                    <time className="text-xs text-gray-500" dateTime={entry.at ? new Date(entry.at).toISOString() : undefined}>
                      {entry.at ? formatDate(entry.at, { includeTime: true }) : ''}
                    </time>
                  </div>
                  {entry.note && <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap break-words">{entry.note}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default ClaimTimeline;
