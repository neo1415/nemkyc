import React from 'react';
import Dialog from "@mui/material/Dialog";
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70%', // Adjust the width for mobile devices
  maxWidth: 400, // Maximum width for larger screens
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 10,
};

const SubmitModal = ({closeModal, resetForm, isSubmitted}) => {
  const handleClose = () => {
    closeModal()
  };

  const newForm=()=>{
    resetForm()
  }

  return (
    <div>
   <Dialog open={isSubmitted} onClose={closeModal} aria-labelledby="form-dialog-title">
  <DialogTitle id="form-dialog-title">Form Submitted</DialogTitle>
  <DialogContent>
    <p>Your form has been successfully submitted!</p>
  </DialogContent>
  <DialogActions>
    <Button onClick={closeModal} color="primary">
      Close
    </Button>
        <Button onClick={resetForm} color="primary">
      Reset Form
    </Button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default SubmitModal;
