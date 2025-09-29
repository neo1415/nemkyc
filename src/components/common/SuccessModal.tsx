import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle2, Home, Loader2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  formType?: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Form Submitted Successfully!",
  message,
  formType = "form",
  isLoading = false,
  loadingMessage = "Your form is being submitted..."
}) => {
  const defaultMessage = `Your ${formType.toLowerCase()} has been submitted successfully. You will receive a confirmation email shortly.`;
  
  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isLoading ? 'bg-white border-2 border-primary/20' : 'bg-green-100'
          }`}>
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            )}
          </div>
          <DialogTitle className={`text-center text-xl ${isLoading ? 'text-primary' : 'text-green-600'}`}>
            {isLoading ? 'Submitting Form...' : title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isLoading ? loadingMessage : (message || defaultMessage)}
          </p>
          {!isLoading && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>For enquiries, call 234-02-014489570</strong>
              </p>
              <p className="text-sm mt-2">
                Email: <a href="mailto:claims@nem-insurance.com" className="text-primary hover:underline">claims@nem-insurance.com</a>
              </p>
            </div>
          )}
        </div>
        {!isLoading && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            {/* <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Go to Dashboard
            </Button> */}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;