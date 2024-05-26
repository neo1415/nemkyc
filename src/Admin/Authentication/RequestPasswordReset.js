import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../APi'; // Import your Firebase auth instance
import { sendPasswordResetEmail } from 'firebase/auth';
import './form.scss';
import { Box, Button, TextField, Typography } from '@mui/material';

const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      alert("Password reset link sent! Check your email.");
      navigate('/signin');
    } catch (e) {
      setLoading(false);
      setError(e.message);
    }
  };

  return (
    <Box className='login' display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Box className='loginTitle' mb={2}>
        <Typography variant="h4">Enter Your Email to Reset Your Password</Typography>
      </Box>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <Box className='Inputs' mb={2}>
          <TextField
            fullWidth
            label="E-mail"
            variant="outlined"
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
        </Box>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        <Box display="flex" justifyContent="center" mb={2}>
          <Button variant="contained" color="primary" type="submit" disabled={loading} fullWidth>
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RequestPasswordReset;
