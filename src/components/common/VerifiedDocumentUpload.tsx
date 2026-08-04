import React from 'react';
import { Label } from '@/components/ui/label';
import { DocumentUploadSection } from '@/components/gemini/DocumentUploadSection';
import type { VerificationResult } from '@/types/geminiDocumentVerification';

interface VerifiedDocumentUploadProps {
  fieldName: string;
  formId: string;
  label: string;
  documentType: 'cac' | 'individual' | 'naicom';
  verificationFormData: Record<string, unknown>;
  formMethods: any;
  uploadedFiles: Record<string, File>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  required?: boolean;
}

/**
 * Shared CDD document control. A required upload is not treated as verified
 * merely because a file was selected: Document AI must process and match it.
 */
const VerifiedDocumentUpload: React.FC<VerifiedDocumentUploadProps> = ({
  fieldName,
  formId,
  label,
  documentType,
  verificationFormData,
  formMethods,
  uploadedFiles,
  setUploadedFiles,
  required = true,
}) => {
  const statusField = `${fieldName}VerificationStatus`;
  const resultField = `${fieldName}Verification`;
  const error = formMethods.formState.errors[fieldName];

  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="required-asterisk">*</span>}</Label>
      <DocumentUploadSection
        formId={formId}
        documentType={documentType}
        formData={verificationFormData}
        currentFile={uploadedFiles[fieldName] || null}
        verificationResult={formMethods.watch(resultField) || null}
        onVerificationComplete={(result: VerificationResult) => {
          formMethods.setValue(resultField, result, { shouldDirty: true });
          formMethods.setValue(statusField, result.isMatch ? 'verified' : 'failed', { shouldDirty: true });
          if (result.isMatch) formMethods.clearErrors(fieldName);
        }}
        onStatusChange={(status) => {
          formMethods.setValue(statusField, status, { shouldDirty: true });
          if (status === 'failed') {
            formMethods.setError(fieldName, {
              type: 'document-verification',
              message: 'The uploaded document does not match the information entered in the form.',
            });
          }
        }}
        onFileSelect={(file) => {
          setUploadedFiles(previous => ({ ...previous, [fieldName]: file }));
          formMethods.setValue(fieldName, file, { shouldDirty: true, shouldValidate: true });
        }}
        onFileRemove={() => {
          setUploadedFiles(previous => {
            const next = { ...previous };
            delete next[fieldName];
            return next;
          });
          formMethods.setValue(fieldName, undefined, { shouldDirty: true, shouldValidate: true });
          formMethods.setValue(statusField, 'idle');
          formMethods.setValue(resultField, null);
        }}
      />
      {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
    </div>
  );
};

export default VerifiedDocumentUpload;
