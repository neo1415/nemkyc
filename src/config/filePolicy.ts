/**
 * Customer document upload policy.
 *
 * Single source of truth for the size and type limits applied to files that
 * customers attach to KYC / CDD / NFIU / claim forms. It mirrors the multer
 * configuration on the public upload endpoint (`/api/public/upload`), so a file
 * that passes here is a file the backend will accept.
 *
 * Every picker, yup schema and upload service must read from this module rather
 * than carrying its own numbers; disagreeing limits are what let a file pass the
 * picker and then silently fail schema validation on submit.
 */

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/** Value for the `accept` attribute of an `<input type="file">`. */
export const FILE_ACCEPT: string = ALLOWED_EXTENSIONS.join(',');

const EXTENSION_TO_MIME: Record<AllowedExtension, readonly AllowedMimeType[]> = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const ALLOWED_MIME_SET: ReadonlySet<string> = new Set(ALLOWED_MIME_TYPES);
const ALLOWED_EXTENSION_SET: ReadonlySet<string> = new Set(ALLOWED_EXTENSIONS);

/** Human readable list of formats, e.g. "PDF, Word (DOC/DOCX), JPG, PNG or GIF". */
export const ALLOWED_FORMATS_LABEL = 'PDF, Word (DOC/DOCX), JPG, PNG or GIF';

export const FILE_TYPE_ERROR = `Please upload a ${ALLOWED_FORMATS_LABEL} file.`;
export const FILE_SIZE_ERROR = `The document must be ${MAX_FILE_SIZE_MB} MB or smaller.`;
export const FILE_EMPTY_ERROR = 'The file appears to be empty or corrupted. Please choose it again.';

export interface FilePolicyResult {
  ok: boolean;
  reason?: string;
}

export const getFileExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
};

/**
 * Map an `accept` string (extensions, MIME types or `image/*`) to the concrete
 * MIME types it permits, intersected with the shared policy.
 */
export const mimeTypesForAccept = (accept: string): Set<string> => {
  const result = new Set<string>();
  for (const raw of accept.split(',')) {
    const value = raw.trim().toLowerCase();
    if (!value) continue;
    if (value === 'image/*') {
      ALLOWED_MIME_TYPES.filter(type => type.startsWith('image/')).forEach(type => result.add(type));
    } else if (ALLOWED_EXTENSION_SET.has(value)) {
      EXTENSION_TO_MIME[value as AllowedExtension].forEach(type => result.add(type));
    } else if (ALLOWED_MIME_SET.has(value)) {
      result.add(value);
    }
  }
  return result;
};

/**
 * Check a file against the shared policy. Accepts anything with `size`, `type`
 * and `name` so it can also validate the plain objects yup hands to `.test()`.
 */
export const isAllowedFile = (
  file: Pick<File, 'size' | 'type'> & Partial<Pick<File, 'name'>> | null | undefined,
): FilePolicyResult => {
  if (!file || typeof file !== 'object') {
    return { ok: false, reason: 'Please choose a file.' };
  }

  const mimeType = (file.type || '').toLowerCase();
  const extension = getFileExtension(file.name || '');

  // Browsers occasionally report an empty MIME type (notably for .doc/.docx on
  // some platforms); fall back to the extension in that case only.
  const typeAllowed = mimeType
    ? ALLOWED_MIME_SET.has(mimeType)
    : ALLOWED_EXTENSION_SET.has(extension);

  if (!typeAllowed) {
    return { ok: false, reason: FILE_TYPE_ERROR };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, reason: FILE_EMPTY_ERROR };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: FILE_SIZE_ERROR };
  }

  return { ok: true };
};

/** Short copy for pickers and helper text. */
export const describeFilePolicy = (): string =>
  `${ALLOWED_FORMATS_LABEL}, up to ${MAX_FILE_SIZE_MB} MB`;

/**
 * Legacy-shaped export kept for existing `FILE_UPLOAD` consumers in
 * `src/config/constants.ts`.
 */
export const FILE_UPLOAD = {
  MAX_SIZE: MAX_FILE_SIZE_BYTES,
  MAX_SIZE_MB: MAX_FILE_SIZE_MB,
  ALLOWED_TYPES: ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  ACCEPT: FILE_ACCEPT,
} as const;
