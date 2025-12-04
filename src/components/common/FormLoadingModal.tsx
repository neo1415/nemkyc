import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FormLoadingModalProps {
  isOpen: boolean;
  message: string;
  submessage?: string;
  showProgress?: boolean;
  progress?: number;
}

/**
 * FormLoadingModal - A consistent loading modal for form submissions
 * 
 * Features:
 * - Shows spinner animation
 * - Displays custom messages for different states
 * - Optional progress bar for file uploads
 * - Prevents user interaction during loading
 * - Accessible with ARIA labels
 * 
 * Usage:
 * ```tsx
 * <FormLoadingModal
 *   isOpen={isSubmitting}
 *   message="Submitting your form..."
 *   submessage="Please wait while we process your submission"
 * />
 * ```
 */
const FormLoadingModal: React.FC<FormLoadingModalProps> = ({
  isOpen,
  message,
  submessage,
  showProgress = false,
  progress = 0
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          {/* Spinner */}
          <Loader2 
            className="h-12 w-12 animate-spin text-primary" 
            aria-label="Loading"
          />
          
          {/* Main message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {message}
            </h3>
            
            {submessage && (
              <p className="text-sm text-gray-600">
                {submessage}
              </p>
            )}
          </div>
          
          {/* Optional progress bar */}
          {showProgress && (
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormLoadingModal;
