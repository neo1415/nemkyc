import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, TextField, Button, IconButton, InputAdornment, Backdrop, CircularProgress } from '@mui/material';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { UserAuth } from '../../Context/AuthContext';
import { auth } from '../../APi';
import './ResetPassword.css';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { confirmPasswordReset } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    if (code) {
      setOobCode(code);
    } else {
      setError('Error retrieving password reset code from the URL.');
    }
  }, [location]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must include at least 8 characters, includes uppercase, lowercase, number, special char.');
      return;
    }

    try {
      await confirmPasswordReset(oobCode, password);
      alert("Password has been reset successfully!");
      setLoading(true); // Show the loading modal
      console.log('Password reset successful. Attempting to clear custom claims.');

      const uid = auth.currentUser?.uid;
      console.log('Retrieved UID:', uid);

      await clearCustomClaims(uid);

      setTimeout(() => {
        navigate('/signin');
      }, 2000); // Redirect after 2 seconds
    } catch (e) {
      setError(e.message);
      console.error('Error during password reset:', e);
    }
  };

  const clearCustomClaims = async (uid) => {
    try {
      if (!uid) {
        console.warn('No UID provided, skipping claim clearing.');
        return;
      }

      const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const clearPasswordClaim = `${serverURL}/clear-password-reset-claims`;

      console.log('Sending request to clear claims for UID:', uid);

      const claimResponse = await csrfProtectedPost(clearPasswordClaim, { uid });
      console.log('Claim clearing response:', claimResponse.data);
    } catch (error) {
      console.error('Error clearing custom claims:', error);
    }
  };

  const validatePassword = (password) => {
    const strongPasswordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
    return strongPasswordRegex.test(password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box className='login' display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Box className='loginTitle' mb={2}>
        <Typography variant="h4" className='sign-in'>Reset Your Password</Typography>
      </Box>
      <form onSubmit={handlePasswordReset} style={{ width: '100%', maxWidth: '400px' }}>
        <Box className='Inputs' mb={2}>
          <TextField
            fullWidth
            label="New Password"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end" className='reset-button'>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            variant="outlined"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleConfirmPasswordVisibility} edge="end" className='reset-button'>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        <Box display="flex" justifyContent="center" mb={2}>
          <Button variant="contained" color="primary" type="submit" fullWidth sx={{ width: '120%' }}>
            Reset Password
          </Button>
        </Box>
      </form>

      {/* Loading Modal */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="inherit" />
          <Typography mt={2}>Please wait while you are redirected to the login page...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default ResetPassword;
