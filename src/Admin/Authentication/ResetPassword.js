import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { AiOutlineSwitcher } from 'react-icons/ai';
import { AiFillSwitcher } from 'react-icons/ai';
import { UserAuth } from '../../Context/AuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    setLoading(true);
    try {
      const response = await axios.post('/reset-password', { oobCode, password });
      if (response.status === 200) {
        alert("Password has been reset successfully!");
        navigate('/signin');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const strongPasswordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
    return strongPasswordRegex.test(password);
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'burgundy' }}>
          Reset Your Password
        </Typography>
      </Box>
      <form onSubmit={handlePasswordReset}>
        <Box mb={2}>
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <AiFillSwitcher /> : <AiOutlineSwitcher />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <AiFillSwitcher /> : <AiOutlineSwitcher />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {error && (
          <Box mb={2}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        <Box textAlign="center">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ bgcolor: 'burgundy', color: 'white' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default ResetPassword;




// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { UserAuth } from '../../Context/AuthContext';
// import { csrfProtectedPost } from '../../Components/CsrfUtils';
// import { Box, Button, TextField, Typography, IconButton, InputAdornment } from '@mui/material';


// const ResetPassword = () => {
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [oobCode, setOobCode] = useState('');
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const { confirmPasswordReset } = UserAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     const queryParams = new URLSearchParams(location.search);
//     const code = queryParams.get('oobCode');
//     if (code) {
//       setOobCode(code);
//     } else {
//       setError('Error retrieving password reset code from the URL.');
//     }
//   }, [location]);

//   const handlePasswordReset = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (password !== confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     if (!validatePassword(password)) {
//       setError('Password must include at least 8 characters, including uppercase, lowercase, number, and special character.');
//       return;
//     }

//     try {
//       await csrfProtectedPost('/reset-password', { oobCode, password });
//       alert("Password has been reset successfully!");
//       navigate('/signin');
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   const validatePassword = (password) => {
//     const strongPasswordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$');
//     return strongPasswordRegex.test(password);
//   };

//   const togglePasswordAiOutLineSwitcher = () => {
//     setShowPassword((prev) => !prev);
//   };

//   return (
//     <Box className='login' display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
//       <Box className='loginTitle' mb={2}>
//         <Typography variant="h4" color="textPrimary" style={{ color: 'burgundy' }}>Reset Your Password</Typography>
//       </Box>
//       <form onSubmit={handlePasswordReset} style={{ width: '100%', maxWidth: '400px' }}>
//         <Box className='Inputs' mb={2}>
//           <TextField
//             fullWidth
//             label="New Password"
//             variant="outlined"
//             type={showPassword ? 'text' : 'password'}
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             margin="normal"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     aria-label="toggle password AiOutLineSwitcher"
//                     onClick={togglePasswordAiOutLineSwitcher}
//                     edge="end"
//                   >
//                     {showPassword ? <AiOutLineSwitcherOff /> : <AiOutLineSwitcher />}
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />

//           <TextField
//             fullWidth
//             label="Confirm New Password"
//             variant="outlined"
//             type={showPassword ? 'text' : 'password'}
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             margin="normal"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     aria-label="toggle password AiOutLineSwitcher"
//                     onClick={togglePasswordAiOutLineSwitcher}
//                     edge="end"
//                   >
//                     {showPassword ? <AiOutLineSwitcherOff /> : <AiOutLineSwitcher />}
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
//         </Box>
//         {error && <Typography color="error" mb={2}>{error}</Typography>}
//         <Box display="flex" justifyContent="center" mb={2}>
//           <Button variant="contained" color="primary" type="submit" fullWidth>
//             Reset Password
//           </Button>
//         </Box>
//       </form>
//     </Box>
//   );
// };

// export default ResetPassword;

