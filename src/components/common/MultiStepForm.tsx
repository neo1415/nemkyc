
import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Submit",
  formMethods
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = async () => {
    // Validate current step before proceeding
    if (formMethods.validateCurrentStep) {
      const isValid = await formMethods.validateCurrentStep(steps[currentStep].id);
      
      // Log validation errors to console for debugging
      const errors = formMethods.formState.errors;
      if (!isValid && Object.keys(errors).length > 0) {
        console.log(`Validation failed for step "${steps[currentStep].id}". Errors:`, errors);
        return; // Don't proceed if validation fails
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
          <div className="min-h-[400px]">
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
              onClick={() => formMethods.handleSubmit(onSubmit)()}
              disabled={!canProceed || isSubmitting}
              className="flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Submitting...' : submitButtonText}</span>
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
