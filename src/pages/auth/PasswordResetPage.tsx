/**
 * Password Reset Page
 * 
 * Forced password reset page for users with temporary passwords.
 * Requires users to change their password before continuing.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { changePassword } from '../../services/userManagementService';
import {
  validatePasswordStrength,
  validatePasswordConfirmation,
} from '../../utils/passwordValidation';
import { useAuth } from '../../contexts/AuthContext';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  const confirmValidation = validatePasswordConfirmation(newPassword, confirmPassword);

  // Check if form is valid
  const isFormValid = (): boolean => {
    return (
      currentPassword.length > 0 &&
      passwordValidation.valid &&
      confirmValidation.valid &&
      newPassword !== currentPassword
    );
  };

  // Handle field blur
  const handleBlur = (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Validate form
    if (!isFormValid()) {
      setError('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully!');
        
        // Redirect to role-based dashboard
        setTimeout(() => {
          if (response.redirectUrl) {
            navigate(response.redirectUrl, { replace: true });
          } else {
            // Fallback redirect based on role
            if (user?.role === 'broker') {
              navigate('/admin/identity', { 
                replace: true, 
                state: { openUploadDialog: true } 
              });
            } else if (user?.role === 'super admin' || user?.role === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
        }, 1500);
      } else {
        setError(response.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get error message for current password
  const getCurrentPasswordError = (): string | undefined => {
    if (touched.currentPassword && !currentPassword) {
      return 'Current password is required';
    }
    return undefined;
  };

  // Get error message for new password
  const getNewPasswordError = (): string | undefined => {
    if (touched.newPassword) {
      if (!newPassword) {
        return 'New password is required';
      }
      if (newPassword === currentPassword) {
        return 'New password must be different from current password';
      }
      if (!passwordValidation.valid) {
        return passwordValidation.errors[0];
      }
    }
    return undefined;
  };

  // Get error message for confirm password
  const getConfirmPasswordError = (): string | undefined => {
    if (touched.confirmPassword) {
      if (!confirmPassword) {
        return 'Please confirm your password';
      }
      if (!confirmValidation.valid) {
        return confirmValidation.error;
      }
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#800020',
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
              Change Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You must change your password before continuing
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Current Password */}
              <TextField
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => handleBlur('currentPassword')}
                error={touched.currentPassword && !!getCurrentPasswordError()}
                helperText={touched.currentPassword && getCurrentPasswordError()}
                fullWidth
                required
                disabled={loading}
                autoFocus
              />

              {/* New Password */}
              <TextField
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => handleBlur('newPassword')}
                error={touched.newPassword && !!getNewPasswordError()}
                helperText={touched.newPassword && getNewPasswordError()}
                fullWidth
                required
                disabled={loading}
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <Box sx={{ mt: -1 }}>
                  <PasswordStrengthIndicator password={newPassword} />
                </Box>
              )}

              {/* Confirm Password */}
              <TextField
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => handleBlur('confirmPassword')}
                error={touched.confirmPassword && !!getConfirmPasswordError()}
                helperText={touched.confirmPassword && getConfirmPasswordError()}
                fullWidth
                required
                disabled={loading}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !isFormValid()}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{
                  mt: 1,
                  bgcolor: '#800020',
                  '&:hover': {
                    bgcolor: '#600018',
                  },
                }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Box>
          </form>

          {/* Security Notice */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Security Notice:</strong> Your password must meet all requirements shown above.
              Never share your password with anyone.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
