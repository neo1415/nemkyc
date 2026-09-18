import { describe, expect, it } from 'vitest';
import {
  describeReattachFields,
  humanizeFieldName,
  mergePendingFormData,
  readPendingFileFields,
  stripFilesFromPayload,
} from '../utils/pendingSubmission';

describe('pending submission file safety helpers', () => {
  it('replaces File and Blob values with null and reports their paths', () => {
    const payload = {
      policyNumber: 'POL-123',
      identification: new File(['id'], 'id.pdf', { type: 'application/pdf' }),
      signatureBlob: new Blob(['sig'], { type: 'image/png' }),
      directors: [
        { name: 'Ada', idCard: new File(['x'], 'ada.png', { type: 'image/png' }) },
        { name: 'Bola', idCard: 'https://storage.example/bola.png' },
      ],
      submittedOn: new Date('2026-01-01T00:00:00.000Z'),
      nothing: null,
    };

    const { formData, pendingFileFields } = stripFilesFromPayload(payload);

    expect(pendingFileFields).toEqual(['identification', 'signatureBlob', 'directors.0.idCard']);
    expect(formData.identification).toBeNull();
    expect(formData.signatureBlob).toBeNull();
    expect(formData.directors[0]).toEqual({ name: 'Ada', idCard: null });
    expect(formData.directors[1].idCard).toBe('https://storage.example/bola.png');
    expect(formData.submittedOn).toBeInstanceOf(Date);
    expect(formData.policyNumber).toBe('POL-123');
    // The original payload is untouched.
    expect(payload.identification).toBeInstanceOf(File);
    // And the result survives the JSON round-trip without turning files into {}.
    expect(JSON.parse(JSON.stringify(formData)).identification).toBeNull();
  });

  it('reports no file fields for a plain payload', () => {
    expect(stripFilesFromPayload({ a: 1, b: 'two' })).toEqual({ formData: { a: 1, b: 'two' }, pendingFileFields: [] });
  });

  it('never lets a stored null overwrite a value present in the current form', () => {
    const reattached = new File(['id'], 'id.pdf', { type: 'application/pdf' });
    const merged = mergePendingFormData(
      { identification: null, cacUrl: 'https://storage.example/cac.pdf', companyName: 'Old Name', onlyStored: 'kept' },
      { identification: reattached, cacUrl: undefined, companyName: 'New Name', onlyCurrent: 'added' },
    );

    expect(merged.identification).toBe(reattached);
    expect(merged.cacUrl).toBe('https://storage.example/cac.pdf');
    expect(merged.companyName).toBe('New Name');
    expect(merged.onlyStored).toBe('kept');
    expect(merged.onlyCurrent).toBe('added');
  });

  it('keeps falsy-but-real current values such as false and 0', () => {
    const merged = mergePendingFormData({ agree: true, count: 5 }, { agree: false, count: 0 });
    expect(merged).toEqual({ agree: false, count: 0 });
  });

  it('builds a readable re-attach prompt', () => {
    expect(humanizeFieldName('carriageConditionDocument')).toBe('Carriage condition document');
    expect(humanizeFieldName('directors.0.idCard')).toBe('Directors 1 id card');
    expect(describeReattachFields(['identification', 'cac'], { cac: 'CAC certificate' }))
      .toBe('Please re-attach: Identification, CAC certificate');
  });

  it('reads pendingFileFields defensively from stored JSON', () => {
    expect(readPendingFileFields({ pendingFileFields: ['a', 2, 'b'] })).toEqual(['a', 'b']);
    expect(readPendingFileFields({})).toEqual([]);
    expect(readPendingFileFields(null)).toEqual([]);
  });
});
