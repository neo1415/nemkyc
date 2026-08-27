export const PDF_FOOTER_FIELD_KEYS = new Set([
  'declarationTrue',
  'signature',
  'agreeToDataPrivacy',
  'signatureDate',
  'digitalSignature',
  'signatureName',
  'signatureOfPolicyholder',
  'signatureOfPolicyHolder'
]);

export const PDF_SKIPPED_SECTION_TITLES = new Set([
  'declaration & signature',
  'system information',
  'file upload'
]);

export function isStorageOrFileUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const normalized = value.trim();
  if (!normalized) return false;

  return /^https?:\/\//i.test(normalized)
    || normalized.startsWith('gs://')
    || normalized.includes('firebasestorage.googleapis.com')
    || normalized.includes('storage.googleapis.com');
}

export function shouldOmitFieldFromPdfBody(
  key: string,
  value: unknown,
  type?: string,
  sectionTitle?: string
): boolean {
  const normalizedKey = key.trim();
  const normalizedSection = (sectionTitle || '').trim().toLowerCase();

  if (type === 'file') return true;
  if (PDF_FOOTER_FIELD_KEYS.has(normalizedKey)) return true;
  if (PDF_SKIPPED_SECTION_TITLES.has(normalizedSection)) return true;
  if (isStorageOrFileUrl(value)) return true;

  if (Array.isArray(value) && value.length > 0 && value.every((item) => isStorageOrFileUrl(item))) {
    return true;
  }

  return false;
}

export function extractAttachmentName(url: string, fieldKey?: string): string {
  try {
    const decoded = decodeURIComponent(url);
    const objectPathMatch = decoded.match(/\/o\/([^?]+)/);
    const rawPath = objectPathMatch?.[1] || decoded;
    const fileName = rawPath.split('/').pop() || '';

    if (fileName) {
      return fileName.replace(/^\d+_/, '').replace(/_/g, ' ');
    }
  } catch {
    // Fall through to field label.
  }

  if (!fieldKey) return 'Attached document';

  return fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function collectPdfAttachmentLabels(
  data: Record<string, unknown>,
  knownFileFields: string[] = []
): string[] {
  const labels = new Set<string>();

  knownFileFields.forEach((field) => {
    const value = data[field];
    if (!value) return;

    if (typeof value === 'string' && isStorageOrFileUrl(value)) {
      labels.add(extractAttachmentName(value, field));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string' && isStorageOrFileUrl(item)) {
          labels.add(extractAttachmentName(item, `${field}-${index + 1}`));
        }
      });
    }
  });

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && isStorageOrFileUrl(value)) {
      labels.add(extractAttachmentName(value, key));
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string' && isStorageOrFileUrl(item)) {
          labels.add(extractAttachmentName(item, `${key}-${index + 1}`));
        }
      });
    }
  });

  return [...labels];
}
