import { describe, expect, it } from 'vitest';
import {
  collectPdfAttachmentLabels,
  extractAttachmentName,
  isStorageOrFileUrl,
  shouldOmitFieldFromPdfBody
} from '../utils/pdfFieldPolicy';

describe('pdfFieldPolicy', () => {
  it('detects firebase storage urls', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/test/o/motor-claims%2Ffile.png?alt=media&token=abc';
    expect(isStorageOrFileUrl(url)).toBe(true);
  });

  it('omits file fields and footer fields from pdf body', () => {
    expect(shouldOmitFieldFromPdfBody('policeReport', 'https://firebasestorage.googleapis.com/a', 'file')).toBe(true);
    expect(shouldOmitFieldFromPdfBody('signature', 'My Name', 'text', 'Declaration & Signature')).toBe(true);
    expect(shouldOmitFieldFromPdfBody('incidentLocation', 'Lagos', 'text', 'Incident Details')).toBe(false);
  });

  it('extracts a readable attachment name from storage urls', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/test/o/motor-claims%2F1787817990684_police-report.png?alt=media';
    expect(extractAttachmentName(url, 'policeReport')).toBe('police-report.png');
  });

  it('collects attachment labels without exposing urls', () => {
    const labels = collectPdfAttachmentLabels({
      policeReport: 'https://firebasestorage.googleapis.com/v0/b/test/o/motor-claims%2F1787817990684_police-report.png?alt=media',
      incidentLocation: 'Lagos'
    }, ['policeReport']);

    expect(labels).toContain('police-report.png');
    expect(labels.some((label) => label.includes('firebasestorage'))).toBe(false);
  });
});
