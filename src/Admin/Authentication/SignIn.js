import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './form.scss';
import { auth } from '../../APi';
// import { sendPasswordResetEmail } from 'firebase/auth';
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { CircularProgress, Box, Typography, Button, TextField } from '@mui/material';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

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
      // Disable the button to prevent double-clicks
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const loginEndpoint = `${serverURL}/verify-token`;
      const response = await csrfProtectedPost(loginEndpoint, { idToken });
  
      if (response.status === 200) {
        const { customToken, role } = response.data;
        await signInWithCustomToken(auth, customToken);
  
        // Redirect based on role
        if (role === 'admin') {
          navigate('/adminHome');
        } else {
          navigate('/adminHome');
        }
      } else {
        setError('Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login.');
    } finally {
      setLoading(false); // Re-enable button once done
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
