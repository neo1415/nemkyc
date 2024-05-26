import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, Typography, Box } from '@mui/material';

const LogDetails = () => {
  const { id } = useParams();
  const [log, setLog] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const logsEndpoint = `${serverURL}/logs/${id}`;

      try {
        const response = await axios.get(logsEndpoint);
        if (response.status === 200) {
          setLog(response.data.log);
        } else {
          console.error('Error fetching log:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching log:', error);
      }
    };

    fetchLog();
  }, [id]);

  if (!log) {
    return <div>Loading...</div>;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Card sx={{ maxWidth: 800, margin: 2, padding: 2 }}>
        <CardContent>
          <Typography variant="h4" component="div" gutterBottom>
            Log Details
          </Typography>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              IP Address:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.ip}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              Date:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.date}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              Request:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.request}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              Status Code:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.statusCode}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              Response Size:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.responseSize}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              Referer:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.referer}
            </Typography>
          </Box>
          <Box component="div" my={2}>
            <Typography variant="h6" component="div">
              User Agent:
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {log.userAgent}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogDetails;
