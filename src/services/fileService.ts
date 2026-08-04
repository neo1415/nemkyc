import { API_BASE_URL } from '@/config/constants';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const getCsrfToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Could not initialize a secure upload');
  }
  const body = await response.json();
  if (!body.csrfToken) {
    throw new Error('Secure upload token was not returned');
  }
  return body.csrfToken;
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error('Please upload a PDF, Word document, JPEG, PNG, or GIF file.');
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('The document must be smaller than 10 MB.');
  }

  try {
    const csrfToken = await getCsrfToken();
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('path', path);

    const response = await fetch(`${API_BASE_URL}/api/public/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'CSRF-Token': csrfToken },
      body: formData,
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || typeof result.url !== 'string') {
      throw new Error(result.message || result.error || 'Document upload failed');
    }
    return result.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
  }
};

export const uploadFormFiles = async (
  files: Record<string, File>,
  formType: string,
): Promise<Record<string, string>> => {
  const results = await Promise.all(
    Object.entries(files).map(async ([key, file]) => [key, await uploadFile(file, `${formType}/${key}`)]),
  );
  return Object.fromEntries(results);
};
