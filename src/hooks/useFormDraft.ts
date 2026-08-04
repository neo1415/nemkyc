
import { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useFormDraft = (formType: string, formMethods: any) => {
  const { saveFormDraft, getFormDraft, clearFormDraft } = useAuth();

  // Load draft on component mount
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const draft = await getFormDraft(formType);
      if (cancelled || !draft || typeof draft !== 'object') return;

      Object.keys(draft).forEach(key => {
        if (draft[key] !== undefined && draft[key] !== null && draft[key] !== '') {
          formMethods.setValue(key, draft[key], { shouldDirty: false });
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [formType, getFormDraft, formMethods]);

  // Auto-save draft when form values change
  const saveDraft = useCallback((data: any) => {
    void saveFormDraft(formType, data);
  }, [formType, saveFormDraft]);

  const loadDraft = useCallback(() => {
    return getFormDraft(formType);
  }, [formType, getFormDraft]);

  const clearDraft = useCallback(() => {
    clearFormDraft(formType);
  }, [clearFormDraft, formType]);

  return { saveDraft, loadDraft, clearDraft };
};
