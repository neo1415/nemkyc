import React from 'react';

interface CompleteFormReviewProps {
  formData: Record<string, unknown> | null | undefined;
}

const INTERNAL_FIELDS = new Set([
  'idempotencyKey',
  'requestId',
  'userUid',
  'submittedByUid',
  'collectionName',
]);

const humanize = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/^./, (letter) => letter.toUpperCase());

const isEmpty = (value: unknown) => value === null || value === undefined || value === '' ||
  (Array.isArray(value) && value.length === 0);

const formatValue = (value: unknown): string => {
  if (typeof File !== 'undefined' && value instanceof File) return value.name;
  if (value instanceof Date) return value.toLocaleDateString('en-GB');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (item && typeof item === 'object') {
        const details = Object.entries(item as Record<string, unknown>)
          .filter(([, nested]) => !isEmpty(nested))
          .map(([key, nested]) => `${humanize(key)}: ${formatValue(nested)}`)
          .join('; ');
        return `${index + 1}. ${details}`;
      }
      return String(item);
    }).join('\n');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => !isEmpty(nested))
      .map(([key, nested]) => `${humanize(key)}: ${formatValue(nested)}`)
      .join('; ');
  }
  if (typeof value === 'string' && /^(?:gs:\/\/|https:\/\/firebasestorage\.googleapis\.com)/i.test(value)) {
    return 'Document uploaded';
  }
  return String(value);
};

/** Full, read-only review used by claim forms before the final confirmation. */
const CompleteFormReview: React.FC<CompleteFormReviewProps> = ({ formData }) => {
  const fields = Object.entries(formData || {})
    .filter(([key, value]) => !key.startsWith('_') && !INTERNAL_FIELDS.has(key) && !isEmpty(value));

  if (fields.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No information to review.</p>;
  }

  return (
    <section className="my-4 rounded-lg border bg-white p-4" aria-label="Complete submission summary">
      <h3 className="mb-3 text-base font-semibold text-gray-900">All entered information</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {fields.map(([key, value]) => (
          <div key={key} className="min-w-0 border-b pb-2 last:border-b-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{humanize(key)}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default CompleteFormReview;
