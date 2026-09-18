import { API_BASE_URL } from '@/config/constants';
import { isAllowedFile } from '@/config/filePolicy';
import { CSRF_UNAVAILABLE_MESSAGE, getCSRFToken } from '@/utils/csrfToken';

const isCsrfRejection = (response: Response, result: Record<string, unknown>) => {
  const detail = `${result.code ?? ''} ${result.error ?? ''} ${result.message ?? ''}`.toLowerCase();
  return response.status === 403 && (detail.includes('csrf') || detail.includes('ebadcsrftoken'));
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const policy = isAllowedFile(file);
  if (!policy.ok) {
    throw new Error(policy.reason);
  }

  try {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('path', path);

    for (let attempt = 0; attempt < 2; attempt++) {
      const csrfToken = await getCSRFToken();
      const response = await fetch(`${API_BASE_URL}/api/public/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'CSRF-Token': csrfToken },
        body: formData,
      });
      const result = await response.json().catch(() => ({})) as Record<string, unknown>;

      if (response.ok && typeof result.url === 'string') {
        return result.url;
      }

      if (attempt === 0 && isCsrfRejection(response, result)) {
        continue;
      }

      if (isCsrfRejection(response, result)) {
        throw new Error(CSRF_UNAVAILABLE_MESSAGE);
      }

      throw new Error(
        (typeof result.message === 'string' && result.message) ||
        (typeof result.error === 'string' && result.error) ||
        'Document upload failed',
      );
    }

    throw new Error('Document upload failed');
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
