import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { get } from 'lodash';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoFill } from '@/hooks/useAutoFill';
import { useRealtimeVerificationValidation } from '@/hooks/useRealtimeVerificationValidation';
import type { FieldValidationConfig, FormTypeWithValidation } from '@/types/realtimeVerificationValidation';
import { IdentifierType } from '@/types/autoFill';
import { getValidationConfigForForm } from '@/config/realtimeValidationConfig';

interface VerifiedIdentifierFieldProps {
  name: string;
  label: string;
  formId: string;
  formType: FormTypeWithValidation;
  identifierType: 'NIN' | 'CAC';
  fieldsToValidate?: FieldValidationConfig[];
  required?: boolean;
  maxLength?: number;
}

/** Identifier input with the same guest autofill and authenticated mismatch checks used by KYC. */
const VerifiedIdentifierField: React.FC<VerifiedIdentifierFieldProps> = ({
  name, label, formId, formType, identifierType, fieldsToValidate, required, maxLength,
}) => {
  const formMethods = useFormContext();
  const { user } = useAuth();
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null);
  const error = get(formMethods.formState.errors, name);
  const registration = formMethods.register(name, {
    onChange: () => error && formMethods.clearErrors(name),
  });

  const autoFill = useAutoFill({
    formElement,
    identifierType: identifierType === 'NIN' ? IdentifierType.NIN : IdentifierType.CAC,
    userId: user?.uid,
    formId,
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: false,
  });

  const realtimeValidation = useRealtimeVerificationValidation({
    formType,
    identifierFieldName: name,
    identifierType,
    fieldsToValidate: fieldsToValidate || getValidationConfigForForm(formType).fieldsToValidate,
    formMethods,
    isAuthenticated: Boolean(user),
  });
  const attachAutoFill = autoFill.attachToField;
  const attachRealtimeValidation = realtimeValidation.attachToIdentifierField;

  useEffect(() => {
    if (!inputElement || !formElement) return;
    attachAutoFill(inputElement);
    const detachRealtimeValidation = user ? attachRealtimeValidation(inputElement) : undefined;
    return () => detachRealtimeValidation?.();
  }, [inputElement, formElement, attachAutoFill, attachRealtimeValidation, user]);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && <span className="required-asterisk">*</span>}</Label>
      <Input
        id={name}
        maxLength={maxLength}
        inputMode={identifierType === 'NIN' ? 'numeric' : 'text'}
        {...registration}
        ref={(element) => {
          registration.ref(element);
          setInputElement(element);
          setFormElement(element?.form || null);
        }}
        className={error ? 'border-destructive' : ''}
      />
      {autoFill.state.status === 'idle' && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Enter the {identifierType === 'NIN' ? '11-digit NIN' : 'CAC/RC number'}; verification starts when you leave this field.
        </p>
      )}
      {autoFill.state.status === 'loading' && <p className="text-sm text-blue-600">Verifying and completing details…</p>}
      {autoFill.state.status === 'success' && <p className="text-sm text-green-600" aria-live="polite">{identifierType} verified successfully.</p>}
      {autoFill.state.error && <p className="text-sm text-destructive">{autoFill.state.error.message}</p>}
      {error && <p className="text-sm text-destructive">{error.message?.toString()}</p>}
    </div>
  );
};

export default VerifiedIdentifierField;
