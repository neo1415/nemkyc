import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Step {
  id: string;
  title: string;
  component: React.ReactNode;
  isValid?: boolean;
}

interface MultiStepFormProps {
  steps: Step[];
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  formMethods: any; // react-hook-form methods
  stepFieldMappings?: Record<number, string[]> | Record<string, string[]>; // Optional field mappings for step validation
  validateStep?: (stepId: string) => Promise<boolean>; // Custom validation function
  initialStep?: number; // Initial step to start from
  onStepChange?: (step: number) => void; // Callback when step changes
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Submit",
  formMethods,
  stepFieldMappings,
  validateStep,
  initialStep = 0,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isValidating, setIsValidating] = useState(false);

  const describeValidationErrors = (errors: Record<string, any>) => {
    const messages: string[] = [];

    const visit = (value: any) => {
      if (!value || messages.length >= 3) return;
      if (typeof value.message === 'string') {
        messages.push(value.message);
        return;
      }
      if (typeof value === 'object') Object.values(value).forEach(visit);
    };

    visit(errors);
    return messages.length > 0
      ? messages.join(' ')
      : 'Please complete the highlighted required fields before continuing.';
  };

  const showValidationErrors = (errors = formMethods.formState.errors) => {
    toast({
      title: 'Please review the form',
      description: describeValidationErrors(errors),
      variant: 'destructive'
    });

    window.setTimeout(() => {
      const firstInvalidField = document.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid="true"], .text-destructive'
      );
      firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in (firstInvalidField || {})) firstInvalidField?.focus();
    }, 0);
  };

  const nextStep = async () => {
    // Use custom validation function if provided
    if (validateStep) {
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        const isValid = await validateStep(currentStepId);
        if (!isValid) {
          showValidationErrors();
          return;
        }
      }
    } else if (stepFieldMappings) {
      // If step field mappings are provided, validate only current step fields
      const currentStepFields = stepFieldMappings[currentStep] || [];
      
      if (currentStepFields.length > 0) {
        const isValid = await formMethods.trigger(currentStepFields);
        
        if (!isValid) {
          showValidationErrors();
          return;
        }
      }
    } else {
      // Fallback: validate all fields if no step mappings provided
      const isValid = await formMethods.trigger();
      
      if (!isValid) {
        showValidationErrors();
        return;
      }
    }
    
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };


  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const canProceed = steps[currentStep]?.isValid !== false;

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep]?.title}</h2>
          </div>

          {/* Step content */}
          <div key={steps[currentStep]?.id} className="min-h-[400px]">
            {steps[currentStep]?.component}
          </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={isFirstStep}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={async () => {
                console.log('Submit button clicked');
                console.log('Form errors:', formMethods.formState.errors);
                console.log('Form values:', formMethods.getValues());
                
                setIsValidating(true);
                
                try {
                  await formMethods.handleSubmit(
                    async (data) => {
                      console.log('Form validation passed, calling onSubmit with data:', data);
                      await onSubmit(data);
                      setIsValidating(false);
                    },
                    (errors) => {
                      console.error('Form validation failed with errors:', errors);
                      setIsValidating(false);
                      showValidationErrors(errors);
                    }
                  )();
                } catch (error) {
                  console.error('Error during form submission:', error);
                  setIsValidating(false);
                  toast({
                    title: 'We could not validate your form',
                    description: 'Your entries are still saved. Please review the highlighted fields and try again.',
                    variant: 'destructive'
                  });
                }
              }}
              disabled={!canProceed || isSubmitting || isValidating}
              className="flex items-center space-x-2"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validating...</span>
                </>
              ) : isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{submitButtonText}</span>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default MultiStepForm;
