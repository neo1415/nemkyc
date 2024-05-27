import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './form.scss';
import { auth } from '../../APi';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { CircularProgress, Box, Typography, Button, TextField } from '@mui/material';

const SignIn = () => {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Handle successful login
      setLoading(false);
      navigate('/adminHome');
    } catch (e) {
      setLoading(false);
      setError(e.message || 'Invalid email or password or check your internet connection');
    }
  };

  return (
    <Box className='login' display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Box className='loginTitle' mb={2}>
        <Typography variant="h4" className='sign-in'>Sign In To Your Account</Typography>
      </Box>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <Box className='Inputs' mb={2}>
          <TextField
            fullWidth
            label="Email Address"
            variant="outlined"
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
        </Box>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        <Box display="flex" justifyContent="center" mb={2}>
          <Button variant="contained" color="primary" type="submit" disabled={loading} fullWidth>
            {loading ? <CircularProgress size={24} /> : 'Log In'}
          </Button>
        </Box>
        <Box display="flex" justifyContent="center">
          <Link to='/requestpasswordreset' className='sign-im'>Reset Password</Link>
        </Box>
      </form>
    </Box>
  );
};

export default SignIn;
