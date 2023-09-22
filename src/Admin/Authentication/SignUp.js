import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Container,
  Grid,
} from '@mui/material';

const UserRegistration = ({ onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegistration = async () => {
    setError('');

    // Define the server URL
    const serverURL = 'http://localhost:3001';

    // Define the registration endpoint
    const registrationEndpoint = `${serverURL}/register`;

    try {
      const response = await axios.post(registrationEndpoint, {
        email,
        password,
        name,
      });

      if (response.status === 201) {
        // Registration was successful
        alert('user added succesfully'); // Redirect to the login page after registration
        if (onUserAdded) {
          onUserAdded({ email, name, role: 'Default' });
        }
      } else {
        setError('Error during registration. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError('Error during registration. Please try again.');
    }
  };

  return (
    <Container>
      <Grid container spacing={2} justify="center">
        <Grid item xs={12} sm={6}>
          <Typography variant="h2" align="center">
            User Registration
          </Typography>
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
  );
};

export default UserRegistration;
