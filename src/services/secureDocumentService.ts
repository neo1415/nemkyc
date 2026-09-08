import { auth } from '@/firebase/config';
import { API_BASE_URL } from '@/config/constants';
import { getCSRFToken } from '@/utils/csrfToken';

export async function downloadSubmissionDocument(
  collection: string,
  submissionId: string,
  fieldKey: string,
  suggestedFileName: string,
): Promise<void> {
  const csrfToken = await getCSRFToken();
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(
    `${API_BASE_URL}/api/forms/${encodeURIComponent(collection)}/${encodeURIComponent(submissionId)}/documents/${encodeURIComponent(fieldKey)}`,
    {
      credentials: 'include',
      headers: {
        'CSRF-Token': csrfToken,
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || result.error || 'Failed to download file');
  }

  const blobUrl = URL.createObjectURL(await response.blob());
  try {
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = suggestedFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
