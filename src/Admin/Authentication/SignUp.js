import React, { useState } from 'react';
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
  CircularProgress,
  Box,
} from '@mui/material';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Replace with your desired burgundy color code
    },
  },
});

const UserRegistration = ({ onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const handleRegistration = async () => {
    setError('');
    const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const registrationEndpoint = `${serverURL}/register`;
  
    try {
      setIsLoading(true);
  
      const response = await csrfProtectedPost(registrationEndpoint, { email, name });
      
      if (response.status === 201) {
        openSuccessModal(); // You can still open the success modal for feedback
        // No need to update the users state manually here
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const openSuccessModal = () => {
    setSuccessModalOpen(true);
    setTimeout(() => {
      setSuccessModalOpen(false);
    }, 3000);
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <CircularProgress size={24} sx={{ color: 'brown', marginRight: 2 }} />
                      Registering...
                    </Box>
                  ) : (
                    'Register'
                  )}
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
            Your account has been created successfully.
            <span role="img" aria-label="checkmark">
              ✅
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default UserRegistration;
