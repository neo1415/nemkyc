'use strict';

const NOISE = /^(NATIONAL INSURANCE COMMISSION|FEDERAL REPUBLIC OF NIGERIA|NAICOM|CERTIFICATE|LICENCE|LICENSE)$/i;

function cleanName(value) {
  return String(value || '').replace(/\s+/g, ' ').replace(/^[\s:.-]+|[\s:.-]+$/g, '').trim();
}

function extractNAICOMCompanyName(text) {
  const source = String(text || '');
  const labelled = source.match(/(?:name\s+of\s+(?:company|licensee)|company\s+name|licensed?\s+(?:entity|company)|licensee)\s*[:\-]?\s*\n?\s*([^\n]{3,120})/i);
  if (labelled) return cleanName(labelled[1]);
  const award = source.match(/(?:issued|granted)\s+to\s*\n?\s*([^\n]{3,120})/i);
  if (award) return cleanName(award[1]);
  const candidates = source.split(/\r?\n/).map(cleanName).filter(line =>
    line.length >= 4 && line.length <= 120 && !NOISE.test(line) &&
    /\b(?:PLC|LIMITED|LTD|INSURANCE|ASSURANCE|BROKERS?)\b/i.test(line)
  );
  return candidates[0] || '';
}

module.exports = { extractNAICOMCompanyName };
