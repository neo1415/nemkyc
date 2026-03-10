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
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VerificationMismatchModalProps {
  open: boolean;
  onClose: () => void;
  mismatches: string[];
  warnings: string[];
  identityType: 'NIN' | 'CAC';
}

/**
 * Modal to display verification data mismatches
 * 
 * Shows field-level mismatches without revealing actual verified data
 * to prevent information leakage while still being helpful to users
 */
export const VerificationMismatchModal: React.FC<VerificationMismatchModalProps> = ({
  open,
  onClose,
  mismatches,
  warnings,
  identityType
}) => {
  const identityLabel = identityType === 'CAC' ? 'CAC' : 'NIN';
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Verification Failed
          </DialogTitle>
          <DialogDescription>
            The information you entered does not match the {identityLabel} verification records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mismatches.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-destructive">
                Fields that don't match:
              </h4>
              <div className="space-y-2">
                {mismatches.map((mismatch, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {mismatch}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-yellow-600">
                Warnings:
              </h4>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <Alert key={index} className="border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="ml-2 text-yellow-800">
                      {warning}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground">
              Please review your entries and ensure they match the information on your {identityLabel} document exactly. 
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="default">
            Review Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
