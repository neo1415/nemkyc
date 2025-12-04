import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SummarySection, generateFormSummary } from '@/utils/formSummaryGenerator';
import { Loader2 } from 'lucide-react';

interface FormSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  formType: string;
  onConfirm: () => void;
  isSubmitting: boolean;
  renderSummary?: (data: any) => React.ReactNode;
  sections?: SummarySection[];
}

/**
 * FormSummaryDialog - A reusable summary dialog for form submissions
 * 
 * Features:
 * - Displays comprehensive form data summary
 * - Organizes data into logical sections
 * - Supports custom renderers for flexibility
 * - Handles conditional field display
 * - Formats dates, booleans, and arrays automatically
 * - Responsive design for mobile and desktop
 * 
 * Usage:
 * ```tsx
 * <FormSummaryDialog
 *   open={showSummary}
 *   onOpenChange={setShowSummary}
 *   formData={formData}
 *   formType="Individual KYC"
 *   onConfirm={confirmSubmit}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
const FormSummaryDialog: React.FC<FormSummaryDialogProps> = ({
  open,
  onOpenChange,
  formData,
  formType,
  onConfirm,
  isSubmitting,
  renderSummary,
  sections: customSections
}) => {
  // Generate summary sections only if formData exists
  const sections = customSections || (formData ? generateFormSummary({
    formData,
    formType,
    customSections
  }) : []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Your Submission</DialogTitle>
          <DialogDescription>
            Please review your {formType} information before submitting. Click "Edit Form" to make changes.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {renderSummary && formData ? (
            // Custom renderer
            <div className="space-y-4">
              {renderSummary(formData)}
            </div>
          ) : !formData ? (
            <div className="text-center py-8 text-gray-500">
              No data to display
            </div>
          ) : (
            // Auto-generated summary
            <div className="space-y-6">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  
                  <div className="space-y-2">
                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2"
                      >
                        <div className="text-sm font-medium text-gray-600">
                          {field.label}:
                        </div>
                        <div className="sm:col-span-2 text-sm text-gray-900 break-words">
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {sectionIndex < sections.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}

              {sections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No data to display
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Edit Form
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSummaryDialog;
