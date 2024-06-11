import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import { Container, Typography, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigate('/signin');
    } catch (e) {
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
    <Container maxWidth="sm">
      <div className='login'>
        <div className='loginTitle'>
          <Typography variant="h4" component="h2" gutterBottom>
            Reset Your Password
          </Typography>
        </div>
        <form onSubmit={handlePasswordReset}>
          <div className='Inputs'>
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={toggleConfirmPasswordVisibility}>
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Reset Password
          </Button>
          {error && <Typography color="error" style={{ marginTop: '2rem' }}>{error}</Typography>}
        </form>
      </div>
    </Container>
  );
};

export default ResetPassword;
