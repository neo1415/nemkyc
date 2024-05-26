import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './form.scss';
import { auth } from '../../APi';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { csrfProtectedPost } from '../../Components/CsrfUtils'; // Ensure the path is correct
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
    setLoading(true); // Show loading spinner

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get the ID token
      const idToken = await userCredential.user.getIdToken(true);

      // Send the ID token to the backend
      const response = await csrfProtectedPost('http://localhost:3001/login', { idToken });

      const data = response.data;
      setLoading(false); // Hide loading spinner

      if (data.redirectTo) {
        navigate(data.redirectTo, { state: { uid: data.uid } });
      } else {
        navigate('/adminHome');
      }
    } catch (e) {
      setLoading(false); // Hide loading spinner
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
