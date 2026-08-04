const normalizeKey = (key: string) => key.replace(/[^a-z0-9]/gi, '').toLowerCase();

const isSensitiveIdentifierKey = (key: string): boolean => {
  const normalized = normalizeKey(key);

  if (['nin', 'bvn', 'idnumber', 'identitynumber', 'nationalid', 'nationalidnumber'].includes(normalized)) {
    return true;
  }

  return [
    'ninnumber',
    'bvnnumber',
    'taxid',
    'taxidentificationnumber',
    'passportnumber',
    'internationalpassportnumber',
    'driverslicensenumber',
    'accountnumber',
    'currentaccountnumber',
    'domicilliaryaccountnumber',
    'domiciliaryaccountnumber',
  ].some(suffix => normalized === suffix || normalized.endsWith(suffix));
};

export const maskIdentifier = (value: unknown, visibleCharacters = 4): unknown => {
  if (value === null || value === undefined || value === '') return value;
  const text = String(value);
  if (text.length <= visibleCharacters) return '*'.repeat(text.length);
  return `${text.slice(0, visibleCharacters)}${'*'.repeat(text.length - visibleCharacters)}`;
};

/** Recursively masks personal and financial identifiers for admin list/table views and exports. */
export const maskSensitiveRecord = <T>(value: T, parentKey = ''): T => {
  if (isSensitiveIdentifierKey(parentKey)) {
    return maskIdentifier(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => maskSensitiveRecord(item)) as T;
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        maskSensitiveRecord(item, key),
      ]),
    ) as T;
  }

  return value;
};

export const isSensitiveAdminField = isSensitiveIdentifierKey;
