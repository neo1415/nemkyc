
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface AuthRequiredSubmitProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToSignup: () => void;
  formType: string;
}

const AuthRequiredSubmit: React.FC<AuthRequiredSubmitProps> = ({
  isOpen,
  onClose,
  onProceedToSignup,
  formType
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return null; // User is already authenticated
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Up Required</DialogTitle>
          <DialogDescription>
            To submit your {formType} form, you need to create an account. 
            Your form data will be saved and submitted once you complete the registration.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 pt-4">
          <Button onClick={onProceedToSignup} className="w-full">
            Create Account & Submit Form
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Continue Editing Form
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredSubmit;
