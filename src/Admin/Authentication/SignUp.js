import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  createTheme,
  ThemeProvider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Replace with your desired burgundy color code
    },
  },
});

const UserRegistration = ({ onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleRegistration = async () => {
    setError('');
  
    // Define the server URL
    const serverURL =' https://nem-server-rhdb.onrender.com';
  
    // Define the registration endpoint
    const registrationEndpoint = `${serverURL}/register`;
  
    try {
      setIsLoading(true);
      const response = await axios.post(registrationEndpoint, {
        email,
        password,
        name,
      });
  
      if (response.status === 201) {
        openSuccessModal();
        // Registration was successful
        if (onUserAdded) {
          onUserAdded({ email, name, role: 'Default' });
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      // Check if the error response has a data property with a message
      if (error.response && error.response.data && error.response.data.message) {
        // Use the server-provided error message
        setError(error.response.data.message);
      } else if (error.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        // Fallback error message
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  const openSuccessModal = () => {
    setSuccessModalOpen(true);

    // Close the success modal after 3 seconds (adjust the timing as needed)
    setTimeout(() => {
      setSuccessModalOpen(false);
    }, 3000);
  };

  return (
    <ThemeProvider theme={theme}>
    <div style={{display:'flex', alignItems:"center", justifyContent:'center',}}>
    <Container>
      <Grid container spacing={2} justify="center">
        <Grid item xs={12} sm={6}>
          <form>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography variant="body1" color="error" align="center">
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleRegistration}
            >
              Register
            </Button>
          </form>
        </Grid>
      </Grid>
    </Container>
    </div>

        {/* Success Modal */}
        <Dialog open={successModalOpen} onClose={() => setSuccessModalOpen(false)}>
        <DialogTitle>Registration Successful</DialogTitle>
        <DialogContent>
          <div className="success-message">
            {isLoading ? (
              <CircularProgress />
            ) : (
              <>
                Your account has been created successfully.
                <span role="img" aria-label="checkmark">
                  ✅
                </span>
              </>
            )}
          </div>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={() => navigate('/login')} color="primary">
            Go to Login
          </Button>
        </DialogActions> */}
      </Dialog>

    </ThemeProvider>
  );
};

export default UserRegistration;
