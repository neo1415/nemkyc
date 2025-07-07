
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useFormDraft = (formType: string, formMethods: any) => {
  const { saveFormDraft, getFormDraft } = useAuth();

  // Load draft on component mount
  useEffect(() => {
    const draft = getFormDraft(formType);
    if (draft) {
      // Reset form with draft data
      Object.keys(draft).forEach(key => {
        if (draft[key] !== undefined && draft[key] !== null && draft[key] !== '') {
          formMethods.setValue(key, draft[key]);
        }
      });
    }
  }, [formType, getFormDraft, formMethods]);

  // Auto-save draft when form values change
  const saveDraft = (data: any) => {
    saveFormDraft(formType, data);
  };

  const loadDraft = () => {
    return getFormDraft(formType);
  };

  const clearDraft = () => {
    localStorage.removeItem(`form_draft_${formType}`);
  };

  return { saveDraft, loadDraft, clearDraft };
};
