'use strict';

/**
 * Server-side port of src/utils/verificationMatcher.ts. Guests never receive registry data, so the
 * comparison between what they typed and what the NIN/CAC registry holds happens here and only the
 * verdict goes back. Messages never reveal the registry values.
 */

const COMPANY_SUFFIXES = {
  'public limited company': 'plc',
  'private limited company': 'ltd',
  'limited liability company': 'llc',
  limited: 'ltd',
  incorporated: 'inc',
  corporation: 'corp',
  company: 'co',
};

function normalizeText(text) {
  if (!text) return '';
  let normalized = String(text).toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [full, abbr] of Object.entries(COMPANY_SUFFIXES)) {
    normalized = normalized.replace(new RegExp(`\\s+${full}$`, 'g'), ` ${abbr}`);
    normalized = normalized.replace(new RegExp(`\\s+${full}\\s+`, 'g'), ` ${abbr} `);
  }
  return normalized;
}

/** Word-overlap similarity (0-1), weighted towards the shorter name so abbreviations still match. */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const words1 = s1.split(' ').filter(Boolean);
  const words2 = s2.split(' ').filter(Boolean);
  let matchCount = 0;
  const matched = new Set();
  for (const w1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (matched.has(i)) continue;
      const w2 = words2[i];
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchCount++;
        matched.add(i);
        break;
      }
    }
  }
  const shortSimilarity = matchCount / Math.min(words1.length, words2.length);
  const longSimilarity = matchCount / Math.max(words1.length, words2.length);
  return shortSimilarity * 0.7 + longSimilarity * 0.3;
}

/** Parses DD-MM-YYYY / DD/MM/YYYY first (registry format), then falls back to native parsing. */
function parseDate(value) {
  if (value instanceof Date) return value;
  if (!value) return null;
  const str = String(value).trim();
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/** Dates equal ignoring time. Missing or unparseable values are not treated as a mismatch. */
function datesMatch(a, b) {
  if (!a || !b) return true;
  const d1 = parseDate(a);
  const d2 = parseDate(b);
  if (!d1 || !d2) return true;
  return d1.getUTCFullYear() === d2.getUTCFullYear()
    && d1.getUTCMonth() === d2.getUTCMonth()
    && d1.getUTCDate() === d2.getUTCDate();
}

const firstString = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

/** Normalizes current and legacy DataPro/cache response shapes. */
function normalizeNINVerificationData(rawData) {
  let source = rawData?.ResponseData || rawData?.responseData || rawData?.data || rawData || {};
  if (source?.ResponseData || source?.responseData) source = source.ResponseData || source.responseData;
  return {
    firstName: firstString(source, ['firstName', 'firstname', 'FirstName', 'first_name', 'givenName', 'forename']),
    middleName: firstString(source, ['middleName', 'middlename', 'MiddleName', 'middle_name', 'otherNames']),
    lastName: firstString(source, ['lastName', 'lastname', 'LastName', 'last_name', 'surname', 'Surname', 'familyName']),
    fullName: firstString(source, ['fullName', 'fullname', 'FullName', 'full_name', 'name', 'Name']),
    birthdate: firstString(source, ['birthdate', 'birthDate', 'BirthDate', 'date_of_birth']),
    dateOfBirth: firstString(source, ['dateOfBirth', 'DateOfBirth', 'dob', 'DOB']),
    gender: firstString(source, ['gender', 'Gender', 'sex', 'Sex']),
  };
}

const GENDER_VARIANTS = [['male', 'm', 'man'], ['female', 'f', 'woman']];

/**
 * @param entered { firstName, lastName, dateOfBirth, gender } as typed by the customer
 * @param verificationData registry response
 * @returns { matches, mismatches: string[], warnings: string[], fields: string[] }
 */
function matchNINData(entered = {}, verificationData = {}) {
  const mismatches = [];
  const warnings = [];
  const fields = [];
  const v = normalizeNINVerificationData(verificationData);
  const verifiedTokens = normalizeText([v.firstName, v.middleName, v.lastName, v.fullName].filter(Boolean).join(' '))
    .split(' ').filter(Boolean);
  const allTokensPresent = (value) => normalizeText(value).split(' ').filter(Boolean)
    .every((token) => verifiedTokens.includes(token));
  const enteredNamesPresent = Boolean(entered.firstName && entered.lastName
    && allTokensPresent(entered.firstName) && allTokensPresent(entered.lastName));

  const checkName = (field, label, verifiedValue) => {
    const value = entered[field];
    if (!value) return;
    if (verifiedValue) {
      if (calculateSimilarity(value, verifiedValue) < 0.6 && !enteredNamesPresent) {
        fields.push(field);
        mismatches.push(`The ${label} you entered does not match the NIN verification records. Please verify the ${label} is correct.`);
      }
    } else if (!allTokensPresent(value)) {
      fields.push(field);
      mismatches.push(`The verification service could not confirm the ${label}. Please retry the verification before submitting.`);
    }
  };
  checkName('firstName', 'first name', v.firstName);
  checkName('lastName', 'last name', v.lastName);

  const verifiedDOB = v.birthdate || v.dateOfBirth;
  if (entered.dateOfBirth && verifiedDOB && !datesMatch(entered.dateOfBirth, verifiedDOB)) {
    fields.push('dateOfBirth');
    mismatches.push('The date of birth you entered does not match the NIN verification records. Please verify the date is correct.');
  }

  if (entered.gender && v.gender) {
    const g1 = normalizeText(entered.gender);
    const g2 = normalizeText(v.gender);
    const same = g1 === g2 || GENDER_VARIANTS.some((set) => set.includes(g1) && set.includes(g2));
    if (!same) warnings.push('The gender differs from NIN records. Please verify this is correct.');
  }

  return { matches: mismatches.length === 0, mismatches, warnings, fields };
}

/**
 * @param entered { companyName, registrationDate, address } as typed by the customer
 * @param verificationData registry response ({ name, registrationDate, address? })
 */
function matchCACData(entered = {}, verificationData = {}) {
  const mismatches = [];
  const warnings = [];
  const fields = [];

  if (entered.companyName && verificationData.name) {
    const similarity = calculateSimilarity(entered.companyName, verificationData.name);
    if (similarity < 0.5) {
      fields.push('companyName');
      mismatches.push('The company name you entered does not match the CAC verification records. Please verify the company name is correct.');
    } else if (similarity < 0.8) {
      warnings.push('The company name you entered is similar but not an exact match with CAC records. Please verify this is correct.');
    }
  }
  if (entered.registrationDate && verificationData.registrationDate
    && !datesMatch(entered.registrationDate, verificationData.registrationDate)) {
    fields.push('registrationDate');
    mismatches.push('The incorporation date you entered does not match the CAC verification records. Please verify the date is correct.');
  }
  if (entered.address && verificationData.address && calculateSimilarity(entered.address, verificationData.address) < 0.3) {
    warnings.push('The office address differs from CAC records. Please verify the address is correct.');
  }

  return { matches: mismatches.length === 0, mismatches, warnings, fields };
}

module.exports = {
  calculateSimilarity,
  datesMatch,
  matchCACData,
  matchNINData,
  normalizeNINVerificationData,
};
