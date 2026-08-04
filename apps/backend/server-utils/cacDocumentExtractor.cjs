const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

function cleanLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractCACCompanyName(text) {
  const patterns = [
    /hereby\s+certifies\s+that\s*[\r\n]+\s*([^\r\n]+?)\s*[\r\n]+\s*is\s+(?:this\s+day|hereby)/i,
    /this\s+is\s+to\s+certify\s+that\s*[\r\n]+\s*([^\r\n]+)/i,
    /(?:company\s+name|name\s+of\s+company|business\s+name)\s*[:\-]?\s*([^\r\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    const companyName = cleanLine(match?.[1]);
    if (companyName.length >= 2) return companyName;
  }

  const companyLine = String(text || '')
    .split(/\r?\n/)
    .map(cleanLine)
    .find((line) => /\b(?:PLC|LTD|LIMITED|INCORPORATED|LLC)\b/i.test(line));

  return companyLine || '';
}

function extractCACRegistrationNumber(text) {
  const value = String(text || '');
  const match =
    value.match(/(?:company\s+)?registration\s+(?:no|number)\.?\s*[:#\-]?\s*(?:RC\s*)?(\d{1,12})/i) ||
    value.match(/\bRC\s*[:#\-]?\s*(\d{1,12})\b/i);

  return match ? `RC${match[1]}` : '';
}

function extractCACRegistrationDate(text) {
  const value = String(text || '');
  const match = value.match(
    /(?:this|on\s+the|the)\s+(\d{1,2})(?:st|nd|rd|th)?\s+day\s+of\s+([a-z]+),?\s+(\d{4})/i,
  );

  if (!match) return '';

  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return '';

  return `${match[1].padStart(2, '0')}/${month}/${match[3]}`;
}

module.exports = {
  extractCACCompanyName,
  extractCACRegistrationNumber,
  extractCACRegistrationDate,
};

