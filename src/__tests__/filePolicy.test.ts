import { describe, expect, it } from 'vitest';
import {
  ALLOWED_MIME_TYPES,
  FILE_ACCEPT,
  FILE_SIZE_ERROR,
  FILE_TYPE_ERROR,
  FILE_UPLOAD,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  describeFilePolicy,
  isAllowedFile,
  mimeTypesForAccept,
} from '../config/filePolicy';
import { FILE_UPLOAD as LEGACY_FILE_UPLOAD } from '../config/constants';

const fileOf = (sizeBytes: number, name: string, type: string) =>
  ({ size: sizeBytes, name, type }) as File;

describe('shared customer file policy', () => {
  it('matches the backend multer limits (10 MB, jpg/png/gif/pdf/doc/docx)', () => {
    expect(MAX_FILE_SIZE_MB).toBe(10);
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(ALLOWED_MIME_TYPES).toEqual(expect.arrayContaining([
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]));
    expect(FILE_ACCEPT.split(',')).toEqual(expect.arrayContaining(['.pdf', '.docx', '.gif']));
  });

  it('keeps the legacy FILE_UPLOAD export pointing at the same policy', () => {
    expect(LEGACY_FILE_UPLOAD).toBe(FILE_UPLOAD);
    expect(LEGACY_FILE_UPLOAD.MAX_SIZE).toBe(MAX_FILE_SIZE_BYTES);
    expect(LEGACY_FILE_UPLOAD.ALLOWED_MIME_TYPES).toBe(ALLOWED_MIME_TYPES);
  });

  it('accepts a 4 MB PDF that the old 3 MB schema limit used to reject', () => {
    expect(isAllowedFile(fileOf(4 * 1024 * 1024, 'statement.pdf', 'application/pdf'))).toEqual({ ok: true });
  });

  it('rejects an 11 MB file with the size reason', () => {
    const result = isAllowedFile(fileOf(11 * 1024 * 1024, 'big.pdf', 'application/pdf'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(FILE_SIZE_ERROR);
  });

  it('rejects an executable with the type reason', () => {
    const result = isAllowedFile(fileOf(1024, 'malware.exe', 'application/x-msdownload'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(FILE_TYPE_ERROR);
  });

  it('rejects an executable even when the browser reports no MIME type', () => {
    expect(isAllowedFile(fileOf(1024, 'malware.exe', '')).ok).toBe(false);
    expect(isAllowedFile(fileOf(1024, 'letter.docx', '')).ok).toBe(true);
  });

  it('rejects empty and missing files', () => {
    expect(isAllowedFile(fileOf(0, 'empty.pdf', 'application/pdf')).ok).toBe(false);
    expect(isAllowedFile(null).ok).toBe(false);
    expect(isAllowedFile(undefined).ok).toBe(false);
  });

  it('expands accept strings only to policy-approved MIME types', () => {
    expect([...mimeTypesForAccept('.pdf,.docx')]).toEqual([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    expect([...mimeTypesForAccept('image/*')]).toEqual(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']);
    expect(mimeTypesForAccept('.exe,.heic').size).toBe(0);
  });

  it('describes the policy for UI copy', () => {
    expect(describeFilePolicy()).toContain('10 MB');
    expect(describeFilePolicy()).toContain('PDF');
  });
});
