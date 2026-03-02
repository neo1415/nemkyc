/**
 * Create User Modal Component
 * 
 * Modal dialog for super admins to create new user accounts.
 * Includes form validation, loading states, and error handling.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { toast } from 'sonner';
import { createUser, type CreateUserRequest, type UserRole } from '../../services/userManagementService';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  role?: string;
  general?: string;
}

const AVAILABLE_ROLES: UserRole[] = [
  'default',
  'broker',
  'admin',
  'compliance',
  'claims',
  'super admin',
];

export function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    role: false,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Clear form after modal closes
      setTimeout(() => {
        setFullName('');
        setEmail('');
        setRole('');
        setErrors({});
        setTouched({
          fullName: false,
          email: false,
          role: false,
        });
      }, 300); // Wait for close animation
    }
  }, [open]);

  // Validate individual field
  const validateField = (field: 'fullName' | 'email' | 'role', value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          return 'Full Name is required';
        }
        return undefined;

      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Invalid email format';
        }
        return undefined;

      case 'role':
        if (!value) {
          return 'Role is required';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Handle field blur (mark as touched and validate)
  const handleBlur = (field: 'fullName' | 'email' | 'role') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    let value: string;
    switch (field) {
      case 'fullName':
        value = fullName;
        break;
      case 'email':
        value = email;
        break;
      case 'role':
        value = role;
        break;
    }
    
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle field change
  const handleChange = (field: 'fullName' | 'email' | 'role', value: string) => {
    // Update value
    switch (field) {
      case 'fullName':
        setFullName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'role':
        setRole(value as UserRole);
        break;
    }

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }

    // Validate if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const fullNameError = validateField('fullName', fullName);
    const emailError = validateField('email', email);
    const roleError = validateField('role', role);

    return !fullNameError && !emailError && !roleError;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      role: true,
    });

    // Validate all fields
    const fullNameError = validateField('fullName', fullName);
    const emailError = validateField('email', email);
    const roleError = validateField('role', role);

    setErrors({
      fullName: fullNameError,
      email: emailError,
      role: roleError,
    });

    // Stop if validation fails
    if (fullNameError || emailError || roleError) {
      return;
    }

    setLoading(true);

    try {
      const data: CreateUserRequest = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: role as UserRole,
      };

      const response = await createUser(data);

      if (response.success) {
        // Show success message
        toast.success(`User account created successfully. Welcome email sent to ${data.email}`);
        
        // Call onSuccess callback
        onSuccess();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Display error from API
        setErrors({
          general: response.error || 'Failed to create user account',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({
        general: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>
        Create New User
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* General Error Alert */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {errors.general}
            </Alert>
          )}

          {/* Full Name Field */}
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            error={touched.fullName && !!errors.fullName}
            helperText={touched.fullName && errors.fullName}
            fullWidth
            required
            disabled={loading}
            autoFocus
          />

          {/* Email Field */}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            fullWidth
            required
            disabled={loading}
          />

          {/* Role Dropdown */}
          <TextField
            select
            label="Role"
            value={role}
            onChange={(e) => handleChange('role', e.target.value)}
            onBlur={() => handleBlur('role')}
            error={touched.role && !!errors.role}
            helperText={touched.role && errors.role}
            fullWidth
            required
            disabled={loading}
          >
            <MenuItem value="" disabled>
              <em>Select a role</em>
            </MenuItem>
            {AVAILABLE_ROLES.map((roleOption) => (
              <MenuItem key={roleOption} value={roleOption}>
                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          {/* Info Message */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            A secure temporary password will be generated and sent to the user's email address.
            The user must change their password on first login.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{
            bgcolor: '#800020',
            '&:hover': {
              bgcolor: '#600018',
            },
          }}
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateUserModal;
