// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel'

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { confirmPasswordReset, user } = UserAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract the oobCode from the URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    if (code) {
      setOobCode(code);
    } else {
      setError('Error retrieving password reset code from the URL.');
    }
  }, [location]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(password)) {
      setError('must include at least 8 characters, includes uppercase, lowercase, number, special char.');
      return;
    }
    try {
      await confirmPasswordReset(oobCode, password);
      // Clear the forcePasswordReset custom claim
      await clearForcePasswordResetClaim();
      alert("Password has been reset successfully!");
      navigate('/signin');
    } catch (e) {
      setError(e.message);
    }
  };

  const clearForcePasswordResetClaim = async () => {
    try {
      // Assuming you have the user's UID stored in the user object from UserAuth
      const uid = user.uid;
      const response = await fetch(`/clear-force-password-reset/${uid}`, {
        method: 'POST',
        headers: {
          // Include headers if needed, such as Content-Type or Authorization
        }
      });
      if (!response.ok) {
        throw new Error('Failed to clear the password reset claim.');
      }
      // Handle the response if needed
    } catch (error) {
      console.error('Error clearing the password reset claim:', error);
      setError('Failed to clear the password reset claim.');
      // You may want to handle this error more gracefully in a production application
    }
  };

  // Implement your password validation logic here
  const validatePassword = (password) => {
    // Example: at least 8 characters, includes uppercase, lowercase, number, special char
    const strongPasswordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
    return strongPasswordRegex.test(password);
  };
  return (
    <div className='login'>
      <div className='loginTitle'>
        <h2>Reset Your Password</h2>
      </div>
      <form onSubmit={handlePasswordReset}>
        <div className='Inputs'>
          <label>New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                color="primary"
              />
            }
            label={showPassword ? 'Hide password' : 'Show password'}
          />

          <label>Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                color="primary"
              />
            }
            label={showPassword ? 'Hide password' : 'Show password'}
          />
        </div>
        <button type="submit">Reset Password</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};
export default ResetPassword;
