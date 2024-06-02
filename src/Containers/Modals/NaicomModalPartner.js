import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

const NaicomModalPartner = ({ open, onClose }) => {
  return (
    <Dialog
    open={open} onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">NAICOM Regulation</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you NAICOM Regulated
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
         component={Link}
         to="/partners"
        >No</Button>
        <Button 
         component={Link}
         to="/partners-naicom"
        autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NaicomModalPartner;
