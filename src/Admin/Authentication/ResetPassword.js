import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { auth } from '../../APi';
import { confirmPasswordReset } from 'firebase/auth';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        setError('Password must include at least 8 characters, including uppercase, lowercase, number, special char.');
        return;
    }

    try {
        await confirmPasswordReset(oobCode, password);

        const user = auth.currentUser;

        const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

        const passwordresetEndpoint = `${serverURL}/clear-force-reset`;

        if (user) {
            const response = await axios.post(passwordresetEndpoint, { uid: user.uid });
            console.log(`Response from clear-force-reset:`, response.data);
            console.log(`forcePasswordReset claim set to false for user ${user.email}`);
            alert("Password has been reset successfully!");
            navigate('/signin');
        }
    } catch (e) {
        console.error('Password reset error:', e.message);
        setError(e.message);
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
    </Box>
  );
};

export default ResetPassword;
