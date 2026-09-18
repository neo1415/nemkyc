/**
 * Helpers shared by the two submission hooks for the "sign in, then resume"
 * detour. A form payload is stashed in sessionStorage as JSON while the guest
 * authenticates; raw `File`/`Blob` values do not survive `JSON.stringify` (they
 * become `{}`), so they are stripped here and their field names recorded so the
 * customer can be asked to re-attach them instead of the form submitting with
 * missing documents.
 */

export interface StrippedPayload<T = any> {
  formData: T;
  /** Dotted paths of every File/Blob that was removed from the payload. */
  pendingFileFields: string[];
}

const isBinary = (value: unknown): boolean =>
  (typeof Blob !== 'undefined' && value instanceof Blob) ||
  (typeof File !== 'undefined' && value instanceof File);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const walk = (value: unknown, path: string, collected: string[]): unknown => {
  if (isBinary(value)) {
    collected.push(path);
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => walk(item, path ? `${path}.${index}` : String(index), collected));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = walk(child, path ? `${path}.${key}` : key, collected);
    }
    return out;
  }
  return value;
};

/**
 * Replace every File/Blob in `payload` with `null` and report where they were.
 * Non-plain objects (Date, class instances) are passed through untouched.
 */
export const stripFilesFromPayload = <T = any>(payload: T): StrippedPayload<T> => {
  const pendingFileFields: string[] = [];
  const formData = walk(payload, '', pendingFileFields) as T;
  return { formData, pendingFileFields };
};

/**
 * Merge a stored pending payload with the values currently in the form. A value
 * present in the current form always wins; a `null`/`undefined` in either side
 * never overwrites a real value from the other. This keeps document URLs from a
 * previous attempt while letting corrected fields replace older values, and
 * stops the `null` placeholders left by `stripFilesFromPayload` from clobbering
 * a file the customer has just re-attached.
 */
export const mergePendingFormData = <T extends Record<string, any>>(
  stored: Record<string, any> | null | undefined,
  current: T | null | undefined,
): T => {
  const result: Record<string, any> = {};
  const keys = new Set([...Object.keys(stored ?? {}), ...Object.keys(current ?? {})]);
  for (const key of keys) {
    const currentValue = current?.[key];
    result[key] = currentValue ?? stored?.[key] ?? currentValue;
  }
  return result as T;
};

/** `carriageConditionDocument` -> "Carriage condition document"; `directors.0.idCard` -> "Directors 1 id card". */
export const humanizeFieldName = (field: string): string => {
  const words = field
    .split('.')
    .map(segment => (/^\d+$/.test(segment) ? String(Number(segment) + 1) : segment))
    .join(' ')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Build the customer-facing message for files that must be attached again.
 * `labels` lets callers substitute product wording for known fields.
 */
export const describeReattachFields = (
  fields: readonly string[],
  labels: Record<string, string> = {},
): string => {
  const names = fields.map(field => labels[field] ?? humanizeFieldName(field));
  return `Please re-attach: ${names.join(', ')}`;
};

export const readPendingFileFields = (pending: unknown): string[] => {
  if (!pending || typeof pending !== 'object') return [];
  const fields = (pending as { pendingFileFields?: unknown }).pendingFileFields;
  return Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : [];
};
